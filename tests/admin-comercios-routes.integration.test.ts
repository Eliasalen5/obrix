import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { resolveIdentity } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as comercios from "@/app/api/v1/admin/comercios/route";
import * as plan from "@/app/api/v1/admin/comercios/[id]/plan/route";
import * as suscripciones from "@/app/api/v1/admin/comercios/[id]/suscripciones/route";

vi.mock("@/lib/auth/token", () => ({ resolveIdentity: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comercio: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    suscripcionComercio: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

type TxMock = {
  suscripcionComercio: Record<"updateMany" | "create", Mock>;
  comercio: Record<"update", Mock>;
};

type DbMock = {
  comercio: Record<"findMany" | "findUnique" | "update", Mock>;
  suscripcionComercio: Record<"updateMany" | "create" | "findMany", Mock>;
  $transaction: Mock;
};

const sessionMock = resolveIdentity as unknown as Mock;
const db = prisma as unknown as DbMock;

let tx: TxMock;

const BASE = "http://localhost/api/v1/admin/comercios";

function conAdmin() {
  sessionMock.mockResolvedValue({ userId: "admin1", role: ROLES.ADMIN as Role });
}

function conRol(role: Role) {
  sessionMock.mockResolvedValue({ userId: "u1", role });
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
  tx = {
    suscripcionComercio: { updateMany: vi.fn(), create: vi.fn() },
    comercio: { update: vi.fn() },
  };
  db.$transaction.mockImplementation((cb: (t: TxMock) => unknown) => cb(tx));
});

describe("admin — comercios: autorización", () => {
  it("GET sin sesión → 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await comercios.GET();
    expect(res.status).toBe(401);
  });

  it("GET con COMERCIO → 403", async () => {
    conRol(ROLES.COMERCIO as Role);
    const res = await comercios.GET();
    expect(res.status).toBe(403);
  });

  it("GET con CLIENTE → 403", async () => {
    conRol(ROLES.CLIENTE as Role);
    const res = await comercios.GET();
    expect(res.status).toBe(403);
  });

  it("PATCH plan sin sesión → 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await plan.PATCH(
      jsonReq(BASE, "PATCH", { plan: "COMERCIO" }),
      ctx("com1"),
    );
    expect(res.status).toBe(401);
  });

  it("PATCH plan con COMERCIO → 403", async () => {
    conRol(ROLES.COMERCIO as Role);
    const res = await plan.PATCH(
      jsonReq(BASE, "PATCH", { plan: "COMERCIO" }),
      ctx("com1"),
    );
    expect(res.status).toBe(403);
    expect(db.comercio.findUnique).not.toHaveBeenCalled();
  });
});

describe("admin — comercios: listado", () => {
  it("GET con ADMIN → 200", async () => {
    conAdmin();
    db.comercio.findMany.mockResolvedValue([{ id: "com1", plan: "INICIAL" }]);
    const res = await comercios.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [{ id: "com1", plan: "INICIAL" }] });
  });

  it("GET suscripciones con ADMIN → 200", async () => {
    conAdmin();
    db.suscripcionComercio.findMany.mockResolvedValue([]);
    const res = await suscripciones.GET(
      new Request(BASE) as NextRequest,
      ctx("com1"),
    );
    expect(res.status).toBe(200);
    expect(db.suscripcionComercio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comercioId: "com1" } }),
    );
  });
});

describe("admin — comercios: asignar plan", () => {
  it("plan válido → cierra la anterior, crea la nueva y actualiza el comercio", async () => {
    conAdmin();
    db.comercio.findUnique.mockResolvedValue({ id: "com1" });
    tx.suscripcionComercio.create.mockResolvedValue({
      id: "s1",
      plan: "PROFESIONAL",
      estado: "ACTIVA",
    });
    tx.comercio.update.mockResolvedValue({
      id: "com1",
      nombre: "Ferretería A",
      plan: "PROFESIONAL",
      planVence: null,
    });

    const res = await plan.PATCH(
      jsonReq(BASE, "PATCH", { plan: "PROFESIONAL", motivo: "upgrade" }),
      ctx("com1"),
    );
    expect(res.status).toBe(200);

    expect(tx.suscripcionComercio.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { comercioId: "com1", estado: "ACTIVA" },
        data: expect.objectContaining({ estado: "CANCELADA" }),
      }),
    );
    expect(tx.suscripcionComercio.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          comercioId: "com1",
          plan: "PROFESIONAL",
          comisionPct: 2,
          asignadoPorId: "admin1",
        }),
      }),
    );
    expect(tx.comercio.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "com1" },
        data: expect.objectContaining({ plan: "PROFESIONAL" }),
      }),
    );
  });

  it("plan inválido → 400 y no abre transacción", async () => {
    conAdmin();
    const res = await plan.PATCH(
      jsonReq(BASE, "PATCH", { plan: "GRATIS" }),
      ctx("com1"),
    );
    expect(res.status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("comercio inexistente → 404", async () => {
    conAdmin();
    db.comercio.findUnique.mockResolvedValue(null);
    const res = await plan.PATCH(
      jsonReq(BASE, "PATCH", { plan: "COMERCIO" }),
      ctx("no-existe"),
    );
    expect(res.status).toBe(404);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
