import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { resolveIdentity } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as pedidos from "@/app/api/v1/comercio/pedidos/route";
import * as pedidoById from "@/app/api/v1/comercio/pedidos/[id]/route";

vi.mock("@/lib/auth/token", () => ({ resolveIdentity: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comercio: { findUnique: vi.fn() },
    pedido: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

type DbMock = {
  comercio: Record<"findUnique", Mock>;
  pedido: Record<
    "findMany" | "findFirst" | "findUniqueOrThrow" | "update" | "updateMany",
    Mock
  >;
};

const sessionMock = resolveIdentity as unknown as Mock;
const db = prisma as unknown as DbMock;

const BASE = "http://localhost/api/v1/comercio/pedidos";

function conComercio() {
  sessionMock.mockResolvedValue({ userId: "u1", role: ROLES.COMERCIO as Role });
  db.comercio.findUnique.mockResolvedValue({ id: "com1" });
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

beforeEach(() => {
  vi.resetAllMocks();
});

describe("comercio — pedidos: autorización", () => {
  it("GET sin sesión → 401", async () => {
    sinSesion();
    const res = await pedidos.GET();
    expect(res.status).toBe(401);
  });

  it("GET con CLIENTE → 403", async () => {
    conRol(ROLES.CLIENTE as Role);
    const res = await pedidos.GET();
    expect(res.status).toBe(403);
  });

  it("GET con ADMIN → 403", async () => {
    conRol(ROLES.ADMIN as Role);
    const res = await pedidos.GET();
    expect(res.status).toBe(403);
  });

  it("COMERCIO sin comercio asociado → 403", async () => {
    sessionMock.mockResolvedValue({
      userId: "u1",
      role: ROLES.COMERCIO as Role,
    });
    db.comercio.findUnique.mockResolvedValue(null);
    const res = await pedidos.GET();
    expect(res.status).toBe(403);
    expect(db.pedido.findMany).not.toHaveBeenCalled();
  });
});

describe("comercio — pedidos: listado scoped", () => {
  it("GET lista solo los pedidos del comercio de la sesión", async () => {
    conComercio();
    db.pedido.findMany.mockResolvedValue([]);
    const res = await pedidos.GET();
    expect(res.status).toBe(200);
    expect(db.pedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comercioId: "com1" } }),
    );
  });

  it("GET por id ajeno → 404", async () => {
    conComercio();
    db.pedido.findFirst.mockResolvedValue(null);
    const res = await pedidoById.GET(
      new Request(BASE) as NextRequest,
      ctx("ajeno"),
    );
    expect(res.status).toBe(404);
    expect(db.pedido.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "ajeno", comercioId: "com1" } }),
    );
  });
});

describe("comercio — pedidos: cambio de estado", () => {
  it("PENDIENTE → CONFIRMADO → 200", async () => {
    conComercio();
    db.pedido.findFirst.mockResolvedValue({ id: "ped1", estado: "PENDIENTE" });
    db.pedido.updateMany.mockResolvedValue({ count: 1 });
    db.pedido.findUniqueOrThrow.mockResolvedValue({ id: "ped1", estado: "CONFIRMADO" });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CONFIRMADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(200);
    expect(db.pedido.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "ped1", estado: "PENDIENTE" }),
        data: { estado: "CONFIRMADO" },
      }),
    );
  });

  it("cambio de estado con carrera (0 filas) → 409", async () => {
    conComercio();
    db.pedido.findFirst.mockResolvedValue({ id: "ped1", estado: "PENDIENTE" });
    db.pedido.updateMany.mockResolvedValue({ count: 0 });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CONFIRMADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(409);
  });

  it("saltear estados (PENDIENTE → ENTREGADO) → 409", async () => {
    conComercio();
    db.pedido.findFirst.mockResolvedValue({ id: "ped1", estado: "PENDIENTE" });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "ENTREGADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(409);
    expect(db.pedido.updateMany).not.toHaveBeenCalled();
  });

  it("ENTREGADO es final → 409", async () => {
    conComercio();
    db.pedido.findFirst.mockResolvedValue({ id: "ped1", estado: "ENTREGADO" });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CANCELADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(409);
  });

  it("estado inválido → 400", async () => {
    conComercio();
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "ENVIADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(400);
  });

  it("pedido ajeno → 404", async () => {
    conComercio();
    db.pedido.findFirst.mockResolvedValue(null);
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CONFIRMADO" }),
      ctx("ajeno"),
    );
    expect(res.status).toBe(404);
  });

  it("error inesperado de base → 500", async () => {
    conComercio();
    db.pedido.findFirst.mockRejectedValue(new Error("boom"));
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CONFIRMADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(500);
  });
});
