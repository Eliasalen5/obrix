import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as categorias from "@/app/api/admin/catalogo/categorias/route";
import * as categoriaById from "@/app/api/admin/catalogo/categorias/[id]/route";
import * as productos from "@/app/api/admin/catalogo/productos/route";
import * as productoById from "@/app/api/admin/catalogo/productos/[id]/route";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    categoria: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    producto: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

type DbMock = {
  categoria: Record<"findMany" | "findUnique" | "create" | "update" | "delete", Mock>;
  producto: Record<"findMany" | "findUnique" | "create" | "update" | "delete", Mock>;
};

const sessionMock = getServerSession as unknown as Mock;
const db = prisma as unknown as DbMock;

function withRole(role: Role) {
  sessionMock.mockResolvedValue({ user: { role }, expires: "" });
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

const CAT_BASE = "http://localhost/api/admin/catalogo/categorias";
const PROD_BASE = "http://localhost/api/admin/catalogo/productos";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("integración — autenticación y autorización", () => {
  it("GET categorías sin sesión → 401", async () => {
    noSession();
    const res = await categorias.GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it("GET categorías con CLIENTE → 403", async () => {
    withRole(ROLES.CLIENTE as Role);
    const res = await categorias.GET();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "No autorizado" });
  });

  it("GET categorías con COMERCIO → 403", async () => {
    withRole(ROLES.COMERCIO as Role);
    const res = await categorias.GET();
    expect(res.status).toBe(403);
  });

  it("POST categorías sin sesión → 401 (no toca la base)", async () => {
    noSession();
    const res = await categorias.POST(
      jsonReq(CAT_BASE, "POST", { nombre: "Cemento" }),
    );
    expect(res.status).toBe(401);
    expect(db.categoria.create).not.toHaveBeenCalled();
  });

  it("GET productos sin sesión → 401", async () => {
    noSession();
    const res = await productos.GET();
    expect(res.status).toBe(401);
  });

  it("DELETE categoría con CLIENTE → 403 (no borra nada)", async () => {
    withRole(ROLES.CLIENTE as Role);
    const res = await categoriaById.DELETE(req(CAT_BASE), ctx("c1"));
    expect(res.status).toBe(403);
    expect(db.categoria.delete).not.toHaveBeenCalled();
  });
});

describe("integración — categorías (ADMIN)", () => {
  it("GET lista categorías → 200 con data", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.findMany.mockResolvedValue([
      { id: "c1", nombre: "Cemento", orden: 0 },
    ]);
    const res = await categorias.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: [{ id: "c1", nombre: "Cemento", orden: 0 }],
    });
  });

  it("POST válido → 201 con data creada", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.create.mockResolvedValue({ id: "c9", nombre: "Arena", orden: 0 });
    const res = await categorias.POST(
      jsonReq(CAT_BASE, "POST", { nombre: "  Arena  " }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      data: { id: "c9", nombre: "Arena", orden: 0 },
    });
    expect(db.categoria.create).toHaveBeenCalledWith({
      data: { nombre: "Arena", orden: 0 },
    });
  });

  it("POST inválido → 400 con detalle de validación", async () => {
    withRole(ROLES.ADMIN as Role);
    const res = await categorias.POST(
      jsonReq(CAT_BASE, "POST", { nombre: "x" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Datos inválidos");
    expect(body.details[0].path).toBe("nombre");
    expect(db.categoria.create).not.toHaveBeenCalled();
  });

  it("POST con JSON roto → 400", async () => {
    withRole(ROLES.ADMIN as Role);
    const res = await categorias.POST(jsonReq(CAT_BASE, "POST", "{no-json"));
    expect(res.status).toBe(400);
  });

  it("GET por id inexistente → 404", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.findUnique.mockResolvedValue(null);
    const res = await categoriaById.GET(req(CAT_BASE), ctx("nope"));
    expect(res.status).toBe(404);
  });

  it("PATCH válido → 200", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.update.mockResolvedValue({ id: "c1", nombre: "Cemento gris", orden: 0 });
    const res = await categoriaById.PATCH(
      jsonReq(CAT_BASE, "PATCH", { nombre: "Cemento gris" }),
      ctx("c1"),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: { id: "c1", nombre: "Cemento gris", orden: 0 },
    });
  });

  it("PATCH inválido → 400", async () => {
    withRole(ROLES.ADMIN as Role);
    const res = await categoriaById.PATCH(
      jsonReq(CAT_BASE, "PATCH", { nombre: "x" }),
      ctx("c1"),
    );
    expect(res.status).toBe(400);
    expect(db.categoria.update).not.toHaveBeenCalled();
  });

  it("DELETE existente → 204", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.delete.mockResolvedValue({ id: "c1" });
    const res = await categoriaById.DELETE(req(CAT_BASE), ctx("c1"));
    expect(res.status).toBe(204);
  });
});

describe("integración — productos (ADMIN)", () => {
  const validProducto = {
    sku: "CEM-001",
    nombre: "Cemento Loma Negra 50kg",
    unidad: "bolsa 50 kg",
    categoriaId: "c1",
  };

  it("POST válido → 201 con categoría incluida", async () => {
    withRole(ROLES.ADMIN as Role);
    db.producto.create.mockResolvedValue({
      id: "p1",
      ...validProducto,
      descripcion: "",
      categoria: { id: "c1", nombre: "Cemento", orden: 0 },
    });
    const res = await productos.POST(
      jsonReq(PROD_BASE, "POST", validProducto),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("p1");
    expect(body.data.categoria.nombre).toBe("Cemento");
  });

  it("POST sin categoría → 400", async () => {
    withRole(ROLES.ADMIN as Role);
    const res = await productos.POST(
      jsonReq(PROD_BASE, "POST", { sku: "X", nombre: "Prod", unidad: "u" }),
    );
    expect(res.status).toBe(400);
    expect(db.producto.create).not.toHaveBeenCalled();
  });

  it("GET por id inexistente → 404", async () => {
    withRole(ROLES.ADMIN as Role);
    db.producto.findUnique.mockResolvedValue(null);
    const res = await productoById.GET(req(PROD_BASE), ctx("nope"));
    expect(res.status).toBe(404);
  });

  it("DELETE existente → 204", async () => {
    withRole(ROLES.ADMIN as Role);
    db.producto.delete.mockResolvedValue({ id: "p1" });
    const res = await productoById.DELETE(req(PROD_BASE), ctx("p1"));
    expect(res.status).toBe(204);
  });
});

describe("integración — errores de base de datos", () => {
  it("POST categoría duplicada (P2002) → 409", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.create.mockRejectedValue(prismaError("P2002"));
    const res = await categorias.POST(
      jsonReq(CAT_BASE, "POST", { nombre: "Cemento" }),
    );
    expect(res.status).toBe(409);
  });

  it("POST producto con categoría inexistente (P2003) → 400", async () => {
    withRole(ROLES.ADMIN as Role);
    db.producto.create.mockRejectedValue(prismaError("P2003"));
    const res = await productos.POST(
      jsonReq(PROD_BASE, "POST", {
        sku: "X",
        nombre: "Prod",
        unidad: "u",
        categoriaId: "no-existe",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("DELETE categoría con productos (P2014) → 409", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.delete.mockRejectedValue(prismaError("P2014"));
    const res = await categoriaById.DELETE(req(CAT_BASE), ctx("c1"));
    expect(res.status).toBe(409);
  });

  it("PATCH recurso inexistente (P2025) → 404", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.update.mockRejectedValue(prismaError("P2025"));
    const res = await categoriaById.PATCH(
      jsonReq(CAT_BASE, "PATCH", { orden: 3 }),
      ctx("nope"),
    );
    expect(res.status).toBe(404);
  });

  it("error inesperado → 500", async () => {
    withRole(ROLES.ADMIN as Role);
    db.categoria.findMany.mockRejectedValue(new Error("boom"));
    const res = await categorias.GET();
    expect(res.status).toBe(500);
  });
});
