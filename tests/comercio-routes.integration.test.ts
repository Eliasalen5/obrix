import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as catalogo from "@/app/api/comercio/catalogo/route";
import * as ofertas from "@/app/api/comercio/ofertas/route";
import * as ofertaById from "@/app/api/comercio/ofertas/[id]/route";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    categoria: { findMany: vi.fn() },
    producto: { findMany: vi.fn(), findUnique: vi.fn() },
    comercio: { findUnique: vi.fn() },
    oferta: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

type DbMock = {
  categoria: Record<"findMany", Mock>;
  producto: Record<"findMany" | "findUnique", Mock>;
  comercio: Record<"findUnique", Mock>;
  oferta: Record<
    "findMany" | "findFirst" | "upsert" | "updateMany" | "deleteMany",
    Mock
  >;
};

const sessionMock = getServerSession as unknown as Mock;
const db = prisma as unknown as DbMock;

const PRODUCTO = {
  id: "p1",
  sku: "OBR-001",
  nombre: "Cemento",
  unidad: "bolsa",
  descripcion: "",
  categoriaId: "c1",
  categoria: { id: "c1", nombre: "CEMENTO_Y_CAL", orden: 1 },
};

const OFERTA = {
  id: "o1",
  comercioId: "com1",
  productoId: "p1",
  precio: 100,
  stock: 5,
  marca: "Acindar",
  presentacion: "",
  activo: true,
  producto: PRODUCTO,
};

function withComercio() {
  sessionMock.mockResolvedValue({
    user: { id: "u1", role: ROLES.COMERCIO as Role },
    expires: "",
  });
  db.comercio.findUnique.mockResolvedValue({ id: "com1" });
}

function withRoleNoComercio(role: Role) {
  sessionMock.mockResolvedValue({
    user: { id: "u1", role },
    expires: "",
  });
}

function noSession() {
  sessionMock.mockResolvedValue(null);
}

function prismaError(code: string) {
  return Object.assign(new Error(`Prisma error ${code}`), { code });
}

function req(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as NextRequest;
}

function jsonReq(url: string, method: string, body: unknown) {
  return req(url, {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const CAT_BASE = "http://localhost/api/comercio/catalogo";
const OF_BASE = "http://localhost/api/comercio/ofertas";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("comercio — autenticación y autorización", () => {
  it("GET ofertas sin sesión → 401", async () => {
    noSession();
    const res = await ofertas.GET();
    expect(res.status).toBe(401);
  });

  it("GET ofertas con ADMIN → 403", async () => {
    withRoleNoComercio(ROLES.ADMIN as Role);
    const res = await ofertas.GET();
    expect(res.status).toBe(403);
  });

  it("GET ofertas con CLIENTE → 403", async () => {
    withRoleNoComercio(ROLES.CLIENTE as Role);
    const res = await ofertas.GET();
    expect(res.status).toBe(403);
  });

  it("COMERCIO sin comercio asociado → 403", async () => {
    sessionMock.mockResolvedValue({
      user: { id: "u1", role: ROLES.COMERCIO as Role },
      expires: "",
    });
    db.comercio.findUnique.mockResolvedValue(null);
    const res = await ofertas.GET();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "El usuario no tiene un comercio asociado",
    });
    expect(db.oferta.findMany).not.toHaveBeenCalled();
  });
});

describe("comercio — catálogo maestro (solo lectura)", () => {
  it("GET catálogo con COMERCIO → 200 con productos", async () => {
    withComercio();
    db.producto.findMany.mockResolvedValue([PRODUCTO]);
    const res = await catalogo.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [PRODUCTO] });
  });
});

describe("comercio — ofertas scoped por comercioId", () => {
  it("GET lista solo ofertas del comercio de la sesión", async () => {
    withComercio();
    db.oferta.findMany.mockResolvedValue([OFERTA]);
    const res = await ofertas.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [OFERTA] });
    expect(db.oferta.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comercioId: "com1" } }),
    );
  });

  it("POST válido → 201 usando el comercioId de la sesión", async () => {
    withComercio();
    db.oferta.upsert.mockResolvedValue(OFERTA);
    const res = await ofertas.POST(
      jsonReq(OF_BASE, "POST", { productoId: "p1", precio: 100 }),
    );
    expect(res.status).toBe(201);
    expect(db.oferta.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          comercioId_productoId: { comercioId: "com1", productoId: "p1" },
        },
        create: expect.objectContaining({ comercioId: "com1", productoId: "p1" }),
      }),
    );
  });

  it("POST ignora un comercioId inyectado en el body (aislamiento)", async () => {
    withComercio();
    db.oferta.upsert.mockResolvedValue(OFERTA);
    const res = await ofertas.POST(
      jsonReq(OF_BASE, "POST", {
        productoId: "p1",
        precio: 100,
        comercioId: "com-ajeno",
      }),
    );
    expect(res.status).toBe(201);
    const arg = db.oferta.upsert.mock.calls[0][0];
    expect(arg.where.comercioId_productoId.comercioId).toBe("com1");
    expect(arg.create.comercioId).toBe("com1");
  });

  it("POST inválido → 400 y no toca la base", async () => {
    withComercio();
    const res = await ofertas.POST(
      jsonReq(OF_BASE, "POST", { productoId: "p1", precio: 0 }),
    );
    expect(res.status).toBe(400);
    expect(db.oferta.upsert).not.toHaveBeenCalled();
  });

  it("PATCH válido → 200 (updateMany scoped + relectura)", async () => {
    withComercio();
    db.oferta.updateMany.mockResolvedValue({ count: 1 });
    db.oferta.findFirst.mockResolvedValue({ ...OFERTA, precio: 250 });
    const res = await ofertaById.PATCH(
      jsonReq(OF_BASE, "PATCH", { precio: 250 }),
      ctx("o1"),
    );
    expect(res.status).toBe(200);
    expect(db.oferta.updateMany).toHaveBeenCalledWith({
      where: { id: "o1", comercioId: "com1" },
      data: { precio: 250 },
    });
  });

  it("PATCH sin campos → 400 'Nada para actualizar'", async () => {
    withComercio();
    const res = await ofertaById.PATCH(
      jsonReq(OF_BASE, "PATCH", {}),
      ctx("o1"),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Nada para actualizar" });
    expect(db.oferta.updateMany).not.toHaveBeenCalled();
  });

  it("PATCH de oferta ajena (count 0) → 404", async () => {
    withComercio();
    db.oferta.updateMany.mockResolvedValue({ count: 0 });
    const res = await ofertaById.PATCH(
      jsonReq(OF_BASE, "PATCH", { precio: 250 }),
      ctx("ajena"),
    );
    expect(res.status).toBe(404);
    expect(db.oferta.findFirst).not.toHaveBeenCalled();
  });

  it("DELETE de oferta ajena (count 0) → 404", async () => {
    withComercio();
    db.oferta.deleteMany.mockResolvedValue({ count: 0 });
    const res = await ofertaById.DELETE(req(OF_BASE), ctx("ajena"));
    expect(res.status).toBe(404);
    expect(db.oferta.deleteMany).toHaveBeenCalledWith({
      where: { id: "ajena", comercioId: "com1" },
    });
  });

  it("DELETE propia → 204", async () => {
    withComercio();
    db.oferta.deleteMany.mockResolvedValue({ count: 1 });
    const res = await ofertaById.DELETE(req(OF_BASE), ctx("o1"));
    expect(res.status).toBe(204);
  });

  it("GET por id ajeno → 404", async () => {
    withComercio();
    db.oferta.findFirst.mockResolvedValue(null);
    const res = await ofertaById.GET(req(OF_BASE), ctx("ajena"));
    expect(res.status).toBe(404);
    expect(db.oferta.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ajena", comercioId: "com1" } }),
    );
  });
});

describe("comercio — errores de base de datos", () => {
  it("GET ofertas con error inesperado → 500", async () => {
    withComercio();
    db.oferta.findMany.mockRejectedValue(new Error("boom"));
    const res = await ofertas.GET();
    expect(res.status).toBe(500);
  });

  it("POST duplicado (P2002) → 409", async () => {
    withComercio();
    db.oferta.upsert.mockRejectedValue(prismaError("P2002"));
    const res = await ofertas.POST(
      jsonReq(OF_BASE, "POST", { productoId: "p1", precio: 100 }),
    );
    expect(res.status).toBe(409);
  });

  it("POST con producto inexistente (P2003) → 400", async () => {
    withComercio();
    db.oferta.upsert.mockRejectedValue(prismaError("P2003"));
    const res = await ofertas.POST(
      jsonReq(OF_BASE, "POST", { productoId: "no-existe", precio: 100 }),
    );
    expect(res.status).toBe(400);
  });
});
