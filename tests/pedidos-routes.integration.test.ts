import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { resolveIdentity } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as pedidos from "@/app/api/v1/pedidos/route";
import * as pedidoById from "@/app/api/v1/pedidos/[id]/route";

vi.mock("@/lib/auth/token", () => ({ resolveIdentity: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cotizacion: { findFirst: vi.fn() },
    comercio: { findFirst: vi.fn() },
    oferta: { findMany: vi.fn() },
    pedido: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

type DbMock = {
  cotizacion: Record<"findFirst", Mock>;
  comercio: Record<"findFirst", Mock>;
  oferta: Record<"findMany", Mock>;
  pedido: Record<
    "create" | "findMany" | "findFirst" | "findUniqueOrThrow" | "update" | "updateMany",
    Mock
  >;
};

const sessionMock = resolveIdentity as unknown as Mock;
const db = prisma as unknown as DbMock;

const COTIZACION = {
  id: "cot1",
  prompt: "parrilla",
  estado: "COMPARADA",
  clienteId: "u1",
  resultadoJson: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  materiales: [
    {
      id: "m1",
      cotizacionId: "cot1",
      productoId: "p1",
      nombre: "Cemento",
      cantidad: 2,
      unidad: "bolsa",
    },
    {
      id: "m2",
      cotizacionId: "cot1",
      productoId: "p2",
      nombre: "Ladrillo común",
      cantidad: 100,
      unidad: "unidad",
    },
    {
      id: "m3",
      cotizacionId: "cot1",
      productoId: null,
      nombre: "Material raro",
      cantidad: 1,
      unidad: "u",
    },
  ],
};

const OFERTAS = [
  { productoId: "p1", precio: 100 },
  { productoId: "p2", precio: 10 },
];

const CUERPO = { cotizacionId: "cot1", comercioId: "com1" };
const BASE = "http://localhost/api/v1/pedidos";

function conCliente() {
  sessionMock.mockResolvedValue({ userId: "u1", role: ROLES.CLIENTE as Role });
}

function conRol(role: Role) {
  sessionMock.mockResolvedValue({ userId: "u1", role });
}

function sinSesion() {
  sessionMock.mockResolvedValue(null);
}

function jsonReq(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function mockCrear() {
  db.pedido.create.mockImplementation(async (args: any) => ({
    id: "ped1",
    clienteId: args.data.clienteId,
    comercioId: args.data.comercioId,
    cotizacionId: args.data.cotizacionId,
    estado: args.data.estado,
    total: args.data.total,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    comercio: {
      id: "com1",
      nombre: "Ferretería A",
      direccion: "Calle 1",
      telefono: "111",
    },
    items: args.data.items.create.map((it: any, i: number) => ({
      id: `i${i + 1}`,
      pedidoId: "ped1",
      ...it,
      producto: {
        id: it.productoId,
        sku: "OBR-001",
        nombre: "Cemento",
        unidad: "bolsa",
      },
    })),
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  db.cotizacion.findFirst.mockResolvedValue(COTIZACION);
  db.comercio.findFirst.mockResolvedValue({ id: "com1" });
  db.oferta.findMany.mockResolvedValue(OFERTAS);
});

describe("pedidos (cliente) — autorización", () => {
  it("POST sin sesión → 401", async () => {
    sinSesion();
    const res = await pedidos.POST(jsonReq(BASE, "POST", CUERPO));
    expect(res.status).toBe(401);
  });

  it("POST con ADMIN → 403", async () => {
    conRol(ROLES.ADMIN as Role);
    const res = await pedidos.POST(jsonReq(BASE, "POST", CUERPO));
    expect(res.status).toBe(403);
  });

  it("POST con COMERCIO → 403", async () => {
    conRol(ROLES.COMERCIO as Role);
    const res = await pedidos.POST(jsonReq(BASE, "POST", CUERPO));
    expect(res.status).toBe(403);
  });
});

describe("pedidos (cliente) — validación", () => {
  it("cuerpo inválido → 400 y no toca la base", async () => {
    conCliente();
    const res = await pedidos.POST(jsonReq(BASE, "POST", { comercioId: "com1" }));
    expect(res.status).toBe(400);
    expect(db.pedido.create).not.toHaveBeenCalled();
  });

  it("JSON inválido → 400", async () => {
    conCliente();
    const res = await pedidos.POST(jsonReq(BASE, "POST", "{no-json"));
    expect(res.status).toBe(400);
  });
});

describe("pedidos (cliente) — creación desde cotización", () => {
  it("POST válido → 201 con ítems solo de materiales cubiertos", async () => {
    conCliente();
    mockCrear();
    const res = await pedidos.POST(jsonReq(BASE, "POST", CUERPO));
    expect(res.status).toBe(201);

    const arg = db.pedido.create.mock.calls[0][0];
    expect(arg.data.estado).toBe("PENDIENTE");
    expect(arg.data.items.create).toEqual([
      { productoId: "p1", cantidad: 2, precioUnitario: 100 },
      { productoId: "p2", cantidad: 100, precioUnitario: 10 },
    ]);
    expect(arg.data.total).toBeCloseTo(2 * 100 + 100 * 10, 2);

    const body = await res.json();
    expect(body.data.estado).toBe("PENDIENTE");
    expect(body.data.items).toHaveLength(2);
    expect(body.data.comercio.nombre).toBe("Ferretería A");
  });

  it("usa el clienteId de la sesión e ignora el del body (aislamiento)", async () => {
    conCliente();
    mockCrear();
    await pedidos.POST(jsonReq(BASE, "POST", { ...CUERPO, clienteId: "ajeno" }));
    const arg = db.pedido.create.mock.calls[0][0];
    expect(arg.data.clienteId).toBe("u1");
  });

  it("cotización ajena o inexistente → 404", async () => {
    conCliente();
    db.cotizacion.findFirst.mockResolvedValue(null);
    const res = await pedidos.POST(jsonReq(BASE, "POST", CUERPO));
    expect(res.status).toBe(404);
    expect(db.pedido.create).not.toHaveBeenCalled();
  });

  it("comercio inexistente o inactivo → 400", async () => {
    conCliente();
    db.comercio.findFirst.mockResolvedValue(null);
    const res = await pedidos.POST(jsonReq(BASE, "POST", CUERPO));
    expect(res.status).toBe(400);
    expect(db.pedido.create).not.toHaveBeenCalled();
  });

  it("comercio que no cubre ningún material → 400", async () => {
    conCliente();
    db.oferta.findMany.mockResolvedValue([]);
    const res = await pedidos.POST(jsonReq(BASE, "POST", CUERPO));
    expect(res.status).toBe(400);
    expect(db.pedido.create).not.toHaveBeenCalled();
  });

  it("error inesperado de base → 500", async () => {
    conCliente();
    db.pedido.create.mockRejectedValue(new Error("boom"));
    const res = await pedidos.POST(jsonReq(BASE, "POST", CUERPO));
    expect(res.status).toBe(500);
  });
});

describe("pedidos (cliente) — listado y detalle", () => {
  it("GET lista solo los propios", async () => {
    conCliente();
    db.pedido.findMany.mockResolvedValue([]);
    const res = await pedidos.GET();
    expect(res.status).toBe(200);
    expect(db.pedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clienteId: "u1" } }),
    );
  });

  it("GET por id ajeno → 404", async () => {
    conCliente();
    db.pedido.findFirst.mockResolvedValue(null);
    const res = await pedidoById.GET(new Request(BASE) as NextRequest, ctx("ajeno"));
    expect(res.status).toBe(404);
    expect(db.pedido.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ajeno", clienteId: "u1" } }),
    );
  });
});

describe("pedidos (cliente) — cancelación", () => {
  it("PATCH cancelar un PENDIENTE → 200", async () => {
    conCliente();
    db.pedido.findFirst.mockResolvedValue({ id: "ped1", estado: "PENDIENTE" });
    db.pedido.updateMany.mockResolvedValue({ count: 1 });
    db.pedido.findUniqueOrThrow.mockResolvedValue({ id: "ped1", estado: "CANCELADO" });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CANCELADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(200);
    expect(db.pedido.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "ped1", estado: "PENDIENTE" }),
        data: { estado: "CANCELADO" },
      }),
    );
  });

  it("PATCH cancelar con carrera (0 filas) → 409", async () => {
    conCliente();
    db.pedido.findFirst.mockResolvedValue({ id: "ped1", estado: "PENDIENTE" });
    db.pedido.updateMany.mockResolvedValue({ count: 0 });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CANCELADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(409);
  });

  it("PATCH cancelar un CONFIRMADO → 409", async () => {
    conCliente();
    db.pedido.findFirst.mockResolvedValue({ id: "ped1", estado: "CONFIRMADO" });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CANCELADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(409);
    expect(db.pedido.updateMany).not.toHaveBeenCalled();
  });

  it("PATCH intentar otro estado → 400 (solo cancela)", async () => {
    conCliente();
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CONFIRMADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(400);
  });

  it("PATCH de pedido ajeno → 404", async () => {
    conCliente();
    db.pedido.findFirst.mockResolvedValue(null);
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CANCELADO" }),
      ctx("ajeno"),
    );
    expect(res.status).toBe(404);
  });
});
