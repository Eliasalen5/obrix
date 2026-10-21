import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { resolveIdentity } from "@/lib/auth/token";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as cotizaciones from "@/app/api/v1/cotizaciones/route";
import * as cotizacionById from "@/app/api/v1/cotizaciones/[id]/route";

vi.mock("@/lib/auth/token", () => ({ resolveIdentity: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    producto: { findMany: vi.fn() },
    oferta: { findMany: vi.fn() },
    cotizacion: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

type DbMock = {
  producto: Record<"findMany", Mock>;
  oferta: Record<"findMany", Mock>;
  cotizacion: Record<"create" | "update" | "findMany" | "findFirst", Mock>;
};

const sessionMock = resolveIdentity as unknown as Mock;
const db = prisma as unknown as DbMock;

const PRODUCTOS = [
  { id: "p1", sku: "OBR-001", nombre: "Cemento Portland 50 kg", unidad: "bolsa 50 kg" },
  { id: "p2", sku: "OBR-005", nombre: "Ladrillo Común 8x18x33 cm", unidad: "unidad" },
];

const OFERTAS = [
  {
    productoId: "p1",
    precio: 100,
    stock: 100,
    comercio: { id: "c1", nombre: "Ferretería A", direccion: "Calle 1", telefono: "111", lat: -34.61, lng: -58.38 },
  },
  {
    productoId: "p2",
    precio: 10,
    stock: 500,
    comercio: { id: "c1", nombre: "Ferretería A", direccion: "Calle 1", telefono: "111", lat: -34.61, lng: -58.38 },
  },
  {
    productoId: "p1",
    precio: 90,
    stock: 100,
    comercio: { id: "c2", nombre: "Ferretería B", direccion: "Calle 2", telefono: "222", lat: -34.9, lng: -58.0 },
  },
];

const CUERPO = {
  prompt: "parrilla de 1,5 m",
  materiales: [
    { nombre: "Cemento Portland", cantidad: 2, unidad: "bolsa 50 kg" },
    { nombre: "Ladrillo común", cantidad: 100, unidad: "unidad" },
  ],
};

function conCliente() {
  sessionMock.mockResolvedValue({ userId: "u1", role: ROLES.CLIENTE as Role });
}

function conRol(role: Role) {
  sessionMock.mockResolvedValue({ userId: "u1", role });
}

function sinSesion() {
  sessionMock.mockResolvedValue(null);
}

function jsonReq(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const BASE = "http://localhost/api/cotizaciones";

function mockCrear() {
  db.cotizacion.create.mockImplementation(async (args: any) => ({
    id: "cot1",
    prompt: args.data.prompt,
    estado: args.data.estado,
    clienteId: args.data.clienteId,
    resultadoJson: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    materiales: args.data.materiales.create.map((m: any, i: number) => ({
      id: `m${i + 1}`,
      ...m,
    })),
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  db.producto.findMany.mockResolvedValue(PRODUCTOS);
  db.oferta.findMany.mockResolvedValue(OFERTAS);
  db.cotizacion.update.mockResolvedValue({});
});

describe("cotizaciones — autorización", () => {
  it("POST sin sesión → 401", async () => {
    sinSesion();
    const res = await cotizaciones.POST(jsonReq(BASE, CUERPO));
    expect(res.status).toBe(401);
  });

  it("POST con ADMIN → 403", async () => {
    conRol(ROLES.ADMIN as Role);
    const res = await cotizaciones.POST(jsonReq(BASE, CUERPO));
    expect(res.status).toBe(403);
  });

  it("GET con COMERCIO → 403", async () => {
    conRol(ROLES.COMERCIO as Role);
    const res = await cotizaciones.GET();
    expect(res.status).toBe(403);
  });
});

describe("cotizaciones — validación", () => {
  it("cuerpo inválido → 400 y no toca la base", async () => {
    conCliente();
    const res = await cotizaciones.POST(
      jsonReq(BASE, { materiales: [{ nombre: "X", cantidad: 0, unidad: "u" }] }),
    );
    expect(res.status).toBe(400);
    expect(db.cotizacion.create).not.toHaveBeenCalled();
  });

  it("JSON inválido → 400", async () => {
    conCliente();
    const res = await cotizaciones.POST(jsonReq(BASE, "{no-json"));
    expect(res.status).toBe(400);
  });

  it("ubicación fuera de rango → 400", async () => {
    conCliente();
    const res = await cotizaciones.POST(
      jsonReq(BASE, { ...CUERPO, ubicacion: { lat: 200, lng: 0 } }),
    );
    expect(res.status).toBe(400);
  });
});

describe("cotizaciones — creación y comparación", () => {
  it("POST válido → 201 con comparación ordenada por cobertura", async () => {
    conCliente();
    mockCrear();
    const res = await cotizaciones.POST(jsonReq(BASE, CUERPO));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data.cotizacion.estado).toBe("COMPARADA");
    expect(body.data.cotizacion.materiales[0].productoId).toBe("p1");
    expect(body.data.cotizacion.materiales[1].productoId).toBe("p2");

    const comercios = body.data.comparacion.comercios;
    expect(comercios.map((c: any) => c.comercioId)).toEqual(["c1", "c2"]);
    expect(comercios[0].cubreTodo).toBe(true);
    expect(comercios[0].total).toBeCloseTo(100 * 2 + 10 * 100, 2);
    expect(comercios[1].faltantes).toHaveLength(1);
  });

  it("persiste el snapshot en resultadoJson", async () => {
    conCliente();
    mockCrear();
    await cotizaciones.POST(jsonReq(BASE, CUERPO));
    expect(db.cotizacion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cot1" },
        data: {
          resultadoJson: expect.stringContaining('"rankingPor":"cobertura_precio"'),
        },
      }),
    );
  });

  it("usa el clienteId de la sesión e ignora el del body (aislamiento)", async () => {
    conCliente();
    mockCrear();
    await cotizaciones.POST(jsonReq(BASE, { ...CUERPO, clienteId: "ajeno" }));
    const arg = db.cotizacion.create.mock.calls[0][0];
    expect(arg.data.clienteId).toBe("u1");
  });

  it("sin ubicación, distanciaKm es null", async () => {
    conCliente();
    mockCrear();
    const res = await cotizaciones.POST(jsonReq(BASE, CUERPO));
    const body = await res.json();
    expect(body.data.comparacion.comercios[0].distanciaKm).toBeNull();
  });

  it("con ubicación incluye distanciaKm por comercio", async () => {
    conCliente();
    mockCrear();
    const res = await cotizaciones.POST(
      jsonReq(BASE, { ...CUERPO, ubicacion: { lat: -34.6037, lng: -58.3816 } }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    const comercios = body.data.comparacion.comercios;
    expect(comercios[0].comercioId).toBe("c1");
    expect(comercios[0].distanciaKm).toBeGreaterThan(0);
    expect(comercios[1].distanciaKm).not.toBeNull();
  });
});

describe("cotizaciones — listado", () => {
  it("GET lista solo las propias", async () => {
    conCliente();
    db.cotizacion.findMany.mockResolvedValue([
      {
        id: "cot1",
        prompt: "x",
        estado: "COMPARADA",
        resultadoJson: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        materiales: [
          { id: "m1", nombre: "Cemento", cantidad: 1, unidad: "bolsa", productoId: "p1" },
        ],
      },
    ]);
    const res = await cotizaciones.GET();
    expect(res.status).toBe(200);
    expect(db.cotizacion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clienteId: "u1" } }),
    );
    const body = await res.json();
    expect(body.data[0].id).toBe("cot1");
    expect(body.data[0].materiales[0].match).toBeNull();
  });
});

describe("cotizaciones — obtener por id", () => {
  it("propia → 200 y usa el snapshot guardado", async () => {
    conCliente();
    const comparacion = {
      itemsTotales: 1,
      rankingPor: "cobertura_precio",
      comercios: [],
      items: [],
      sinMatch: [],
      advertencias: [],
    };
    db.cotizacion.findFirst.mockResolvedValue({
      id: "cot1",
      prompt: "x",
      estado: "COMPARADA",
      resultadoJson: JSON.stringify({ version: 1, comparacion, matches: [] }),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      materiales: [
        { id: "m1", nombre: "Cemento", cantidad: 1, unidad: "bolsa", productoId: "p1" },
      ],
    });
    const res = await cotizacionById.GET(new Request(BASE) as NextRequest, ctx("cot1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.comparacion.rankingPor).toBe("cobertura_precio");
    expect(db.cotizacion.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cot1", clienteId: "u1" } }),
    );
  });

  it("ajena o inexistente → 404", async () => {
    conCliente();
    db.cotizacion.findFirst.mockResolvedValue(null);
    const res = await cotizacionById.GET(new Request(BASE) as NextRequest, ctx("ajena"));
    expect(res.status).toBe(404);
  });
});

describe("cotizaciones — errores de base", () => {
  it("error inesperado al crear → 500", async () => {
    conCliente();
    db.cotizacion.create.mockRejectedValue(new Error("boom"));
    const res = await cotizaciones.POST(jsonReq(BASE, CUERPO));
    expect(res.status).toBe(500);
  });
});
