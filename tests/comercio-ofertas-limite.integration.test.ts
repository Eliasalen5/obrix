import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { resolveIdentity } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as ofertas from "@/app/api/v1/comercio/ofertas/route";

vi.mock("@/lib/auth/token", () => ({ resolveIdentity: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comercio: { findUnique: vi.fn() },
    oferta: {
      findUnique: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

type DbMock = {
  comercio: Record<"findUnique", Mock>;
  oferta: Record<"findUnique" | "count" | "upsert", Mock>;
};

const sessionMock = resolveIdentity as unknown as Mock;
const db = prisma as unknown as DbMock;

const BASE = "http://localhost/api/v1/comercio/ofertas";

function conComercio(plan: string) {
  sessionMock.mockResolvedValue({ userId: "u1", role: ROLES.COMERCIO as Role });
  db.comercio.findUnique.mockResolvedValue({ id: "com1", activo: true, plan });
}

function jsonReq(body: unknown) {
  return new Request(BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const CUERPO = { productoId: "p1", precio: 100 };

beforeEach(() => {
  vi.resetAllMocks();
  db.oferta.upsert.mockResolvedValue({ id: "o1" });
});

describe("comercio — límite de productos por plan", () => {
  it("plan INICIAL con 50 publicados y producto nuevo → 403", async () => {
    conComercio("INICIAL");
    db.oferta.findUnique.mockResolvedValue(null);
    db.oferta.count.mockResolvedValue(50);
    const res = await ofertas.POST(jsonReq(CUERPO));
    expect(res.status).toBe(403);
    expect(db.oferta.upsert).not.toHaveBeenCalled();
  });

  it("plan INICIAL con 49 publicados → 201", async () => {
    conComercio("INICIAL");
    db.oferta.findUnique.mockResolvedValue(null);
    db.oferta.count.mockResolvedValue(49);
    const res = await ofertas.POST(jsonReq(CUERPO));
    expect(res.status).toBe(201);
    expect(db.oferta.upsert).toHaveBeenCalled();
  });

  it("editar un producto ya publicado no aplica el límite", async () => {
    conComercio("INICIAL");
    db.oferta.findUnique.mockResolvedValue({ id: "o1" });
    db.oferta.count.mockResolvedValue(50);
    const res = await ofertas.POST(jsonReq(CUERPO));
    expect(res.status).toBe(201);
    expect(db.oferta.count).not.toHaveBeenCalled();
  });

  it("plan PROFESIONAL (ilimitado) no chequea el límite", async () => {
    conComercio("PROFESIONAL");
    db.oferta.findUnique.mockResolvedValue(null);
    db.oferta.count.mockResolvedValue(500);
    const res = await ofertas.POST(jsonReq(CUERPO));
    expect(res.status).toBe(201);
    expect(db.oferta.count).not.toHaveBeenCalled();
  });

  it("body inválido → 400 y no consulta la base", async () => {
    conComercio("INICIAL");
    const res = await ofertas.POST(jsonReq({ productoId: "p1", precio: 0 }));
    expect(res.status).toBe(400);
    expect(db.oferta.findUnique).not.toHaveBeenCalled();
  });
});
