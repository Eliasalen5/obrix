import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { resolveIdentity } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as resumen from "@/app/api/v1/comercio/resumen/route";

vi.mock("@/lib/auth/token", () => ({ resolveIdentity: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comercio: { findUnique: vi.fn() },
    oferta: { count: vi.fn() },
    pedido: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

type DbMock = {
  comercio: Record<"findUnique", Mock>;
  oferta: Record<"count", Mock>;
  pedido: Record<"count" | "aggregate" | "findMany", Mock>;
};

const sessionMock = resolveIdentity as unknown as Mock;
const db = prisma as unknown as DbMock;

function conComercio() {
  sessionMock.mockResolvedValue({ userId: "u1", role: ROLES.COMERCIO as Role });
  db.comercio.findUnique.mockResolvedValue({
    id: "com1",
    activo: true,
    plan: "INICIAL",
  });
}

function conComercioInactivo() {
  sessionMock.mockResolvedValue({ userId: "u1", role: ROLES.COMERCIO as Role });
  db.comercio.findUnique.mockResolvedValue({ id: "com1", activo: false });
}

function conRol(role: Role) {
  sessionMock.mockResolvedValue({ userId: "u1", role });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("comercio — resumen: autorización", () => {
  it("GET sin sesión → 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await resumen.GET();
    expect(res.status).toBe(401);
  });

  it("GET con CLIENTE → 403", async () => {
    conRol(ROLES.CLIENTE as Role);
    const res = await resumen.GET();
    expect(res.status).toBe(403);
  });

  it("GET con ADMIN → 403", async () => {
    conRol(ROLES.ADMIN as Role);
    const res = await resumen.GET();
    expect(res.status).toBe(403);
  });

  it("COMERCIO sin comercio asociado → 403", async () => {
    sessionMock.mockResolvedValue({
      userId: "u1",
      role: ROLES.COMERCIO as Role,
    });
    db.comercio.findUnique.mockResolvedValue(null);
    const res = await resumen.GET();
    expect(res.status).toBe(403);
    expect(db.pedido.count).not.toHaveBeenCalled();
  });

  it("COMERCIO inactivo → 403", async () => {
    conComercioInactivo();
    const res = await resumen.GET();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Comercio inactivo" });
    expect(db.oferta.count).not.toHaveBeenCalled();
  });
});

describe("comercio — resumen: agregados", () => {
  function prepararDatos() {
    conComercio();
    db.oferta.count
      .mockResolvedValueOnce(8) // publicados
      .mockResolvedValueOnce(6); // activos
    db.pedido.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2) // pendientes
      .mockResolvedValueOnce(7); // vendidos (no cancelados)
    db.pedido.aggregate
      .mockResolvedValueOnce({ _sum: { total: 7000 } }) // total histórico
      .mockResolvedValueOnce({ _sum: { total: 1200 } }); // mes en curso
    db.pedido.findMany.mockResolvedValue([
      {
        id: "ped1",
        estado: "PENDIENTE",
        total: 500,
        createdAt: new Date("2026-01-05T12:00:00.000Z"),
        _count: { items: 2 },
      },
    ]);
  }

  it("devuelve KPIs y recientes calculados", async () => {
    prepararDatos();
    const res = await resumen.GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      plan: {
        id: "INICIAL",
        nombre: "Obrix Inicial",
        comisionPct: 6,
        limiteProductos: 50,
      },
      productos: { publicados: 8, activos: 6 },
      pedidos: { total: 10, pendientes: 2 },
      ventas: { total: 7000, mes: 1200, ticketPromedio: 1000 },
      recientes: [
        {
          id: "ped1",
          estado: "PENDIENTE",
          total: 500,
          itemsCount: 2,
        },
      ],
    });
  });

  it("acota todas las consultas al comercio de la sesión", async () => {
    prepararDatos();
    await resumen.GET();
    expect(db.oferta.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comercioId: "com1" } }),
    );
    expect(db.pedido.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comercioId: "com1" } }),
    );
    expect(db.pedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { comercioId: "com1" },
        take: 5,
      }),
    );
  });

  it("las ventas excluyen pedidos CANCELADO", async () => {
    prepararDatos();
    await resumen.GET();
    expect(db.pedido.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          comercioId: "com1",
          estado: { not: "CANCELADO" },
        },
      }),
    );
  });

  it("sin ventas el ticket promedio es 0", async () => {
    conComercio();
    db.oferta.count.mockResolvedValue(0);
    db.pedido.count.mockResolvedValue(0);
    db.pedido.aggregate.mockResolvedValue({ _sum: { total: null } });
    db.pedido.findMany.mockResolvedValue([]);
    const res = await resumen.GET();
    const body = await res.json();
    expect(body.data.ventas).toEqual({ total: 0, mes: 0, ticketPromedio: 0 });
  });

  it("error inesperado de base → 500", async () => {
    conComercio();
    db.oferta.count.mockRejectedValue(new Error("boom"));
    const res = await resumen.GET();
    expect(res.status).toBe(500);
  });
});
