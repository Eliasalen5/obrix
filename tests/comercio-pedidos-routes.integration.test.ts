import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as pedidos from "@/app/api/comercio/pedidos/route";
import * as pedidoById from "@/app/api/comercio/pedidos/[id]/route";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comercio: { findUnique: vi.fn() },
    pedido: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
}));

type DbMock = {
  comercio: Record<"findUnique", Mock>;
  pedido: Record<"findMany" | "findFirst" | "update", Mock>;
};

const sessionMock = getServerSession as unknown as Mock;
const db = prisma as unknown as DbMock;

const BASE = "http://localhost/api/comercio/pedidos";

function conComercio() {
  sessionMock.mockResolvedValue({
    user: { id: "u1", role: ROLES.COMERCIO as Role },
    expires: "",
  });
  db.comercio.findUnique.mockResolvedValue({ id: "com1" });
}

function conRol(role: Role) {
  sessionMock.mockResolvedValue({ user: { id: "u1", role }, expires: "" });
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
      user: { id: "u1", role: ROLES.COMERCIO as Role },
      expires: "",
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
    db.pedido.update.mockResolvedValue({ id: "ped1", estado: "CONFIRMADO" });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "CONFIRMADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(200);
    expect(db.pedido.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ped1" },
        data: { estado: "CONFIRMADO" },
      }),
    );
  });

  it("saltear estados (PENDIENTE → ENTREGADO) → 409", async () => {
    conComercio();
    db.pedido.findFirst.mockResolvedValue({ id: "ped1", estado: "PENDIENTE" });
    const res = await pedidoById.PATCH(
      jsonReq(BASE, "PATCH", { estado: "ENTREGADO" }),
      ctx("ped1"),
    );
    expect(res.status).toBe(409);
    expect(db.pedido.update).not.toHaveBeenCalled();
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
