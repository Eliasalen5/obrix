import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as comercioSolicitudes from "@/app/api/comercio/solicitudes/route";
import * as adminSolicitudes from "@/app/api/admin/solicitudes/route";
import * as aprobar from "@/app/api/admin/solicitudes/[id]/aprobar/route";
import * as rechazar from "@/app/api/admin/solicitudes/[id]/rechazar/route";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// tx comparte los mismos mocks que prisma para poder inspeccionar la transacción
const txMock = {
  solicitudProducto: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  producto: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  oferta: { findUnique: vi.fn(), create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    producto: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    comercio: { findUnique: vi.fn() },
    oferta: { findUnique: vi.fn(), create: vi.fn() },
    solicitudProducto: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

type DbMock = {
  producto: Record<"findMany" | "findUnique" | "create", Mock>;
  comercio: Record<"findUnique", Mock>;
  oferta: Record<"findUnique" | "create", Mock>;
  solicitudProducto: Record<
    | "findUnique"
    | "findUniqueOrThrow"
    | "findMany"
    | "create"
    | "update"
    | "updateMany",
    Mock
  >;
  $transaction: Mock;
};

const sessionMock = getServerSession as unknown as Mock;
const db = prisma as unknown as DbMock;

const PROPUESTA = {
  nombre: "Tornillo autoperforante 8x2",
  categoriaId: "c1",
  unidad: "caja 100 u",
  marca: "Fijaciones SA",
  fabricante: "Fijaciones SA",
  codigoBarras: "",
  codigoFabricante: "",
  descripcion: "",
  imagenUrl: "",
  atributos: {},
  precio: 4500,
  stock: 3,
};

const SOLICITUD = {
  id: "s1",
  comercioId: "com1",
  estado: "PENDIENTE_REVISION",
  datos: PROPUESTA,
  clavePendiente: "tornillo autoperforante 8x2 caja 100 u fijaciones sa",
  productoId: null,
  motivoRechazo: "",
  revisadoById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function withComercio() {
  sessionMock.mockResolvedValue({
    user: { id: "u1", role: ROLES.COMERCIO as Role },
    expires: "",
  });
  db.comercio.findUnique.mockResolvedValue({ id: "com1" });
}

function withAdmin() {
  sessionMock.mockResolvedValue({
    user: { id: "adm1", role: ROLES.ADMIN as Role },
    expires: "",
  });
}

function withRole(role: Role) {
  sessionMock.mockResolvedValue({ user: { id: "u1", role }, expires: "" });
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

const C_BASE = "http://localhost/api/comercio/solicitudes";
const A_BASE = "http://localhost/api/admin/solicitudes";

beforeEach(() => {
  vi.resetAllMocks();
  // $transaction ejecuta el callback con el txMock
  db.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb(txMock),
  );
});

describe("comercio — solicitudes de producto", () => {
  it("GET sin sesión → 401", async () => {
    noSession();
    const res = await comercioSolicitudes.GET(req(C_BASE));
    expect(res.status).toBe(401);
  });

  it("GET con CLIENTE → 403", async () => {
    withRole(ROLES.CLIENTE as Role);
    const res = await comercioSolicitudes.GET(req(C_BASE));
    expect(res.status).toBe(403);
  });

  it("GET lista solo las solicitudes del comercio de la sesión", async () => {
    withComercio();
    db.solicitudProducto.findMany.mockResolvedValue([SOLICITUD]);
    const res = await comercioSolicitudes.GET(req(C_BASE));
    expect(res.status).toBe(200);
    expect(db.solicitudProducto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ comercioId: "com1" }),
      }),
    );
  });

  it("POST crea una solicitud pendiente (no un producto público)", async () => {
    withComercio();
    db.producto.findMany.mockResolvedValue([]);
    db.solicitudProducto.create.mockResolvedValue(SOLICITUD);

    const res = await comercioSolicitudes.POST(
      jsonReq(C_BASE, "POST", { propuesta: PROPUESTA }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.solicitud.estado).toBe("PENDIENTE_REVISION");
    // no se crea producto maestro
    expect(db.producto.create).not.toHaveBeenCalled();
    expect(db.solicitudProducto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          comercioId: "com1",
          estado: "PENDIENTE_REVISION",
        }),
      }),
    );
  });

  it("POST sin comercio asociado → 403", async () => {
    sessionMock.mockResolvedValue({
      user: { id: "u1", role: ROLES.COMERCIO as Role },
      expires: "",
    });
    db.comercio.findUnique.mockResolvedValue(null);
    const res = await comercioSolicitudes.POST(
      jsonReq(C_BASE, "POST", { propuesta: PROPUESTA }),
    );
    expect(res.status).toBe(403);
  });

  it("POST con datos inválidos → 400", async () => {
    withComercio();
    const res = await comercioSolicitudes.POST(
      jsonReq(C_BASE, "POST", { propuesta: { nombre: "x" } }),
    );
    expect(res.status).toBe(400);
    expect(db.solicitudProducto.create).not.toHaveBeenCalled();
  });

  it("POST con coincidencia confiable (mismo código de barras) → 409", async () => {
    withComercio();
    db.producto.findMany.mockResolvedValue([
      {
        id: "p1",
        sku: "P1",
        nombre: "Clavo",
        unidad: "kg",
        codigoBarras: "7791234567890",
      },
    ]);
    const res = await comercioSolicitudes.POST(
      jsonReq(C_BASE, "POST", {
        propuesta: { ...PROPUESTA, codigoBarras: "7791234567890" },
      }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.details.coincidencias[0].id).toBe("p1");
    expect(db.solicitudProducto.create).not.toHaveBeenCalled();
  });

  it("POST duplicado pendiente (P2002) → 409 anti doble envío", async () => {
    withComercio();
    db.producto.findMany.mockResolvedValue([]);
    db.solicitudProducto.create.mockRejectedValue(prismaError("P2002"));
    const res = await comercioSolicitudes.POST(
      jsonReq(C_BASE, "POST", { propuesta: PROPUESTA }),
    );
    expect(res.status).toBe(409);
  });

  it("POST ignora un comercioId inyectado en el body (aislamiento)", async () => {
    withComercio();
    db.producto.findMany.mockResolvedValue([]);
    db.solicitudProducto.create.mockResolvedValue(SOLICITUD);
    await comercioSolicitudes.POST(
      jsonReq(C_BASE, "POST", {
        propuesta: PROPUESTA,
        comercioId: "com-hacker",
      }),
    );
    expect(db.solicitudProducto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ comercioId: "com1" }),
      }),
    );
  });
});

describe("admin — revisión de solicitudes", () => {
  it("GET sin sesión → 401", async () => {
    noSession();
    const res = await adminSolicitudes.GET(req(A_BASE));
    expect(res.status).toBe(401);
  });

  it("GET con COMERCIO → 403", async () => {
    withRole(ROLES.COMERCIO as Role);
    const res = await adminSolicitudes.GET(req(A_BASE));
    expect(res.status).toBe(403);
  });

  it("GET con estado inválido → 400", async () => {
    withAdmin();
    const res = await adminSolicitudes.GET(req(`${A_BASE}?estado=LOCO`));
    expect(res.status).toBe(400);
  });

  it("GET con ADMIN → 200", async () => {
    withAdmin();
    db.solicitudProducto.findMany.mockResolvedValue([SOLICITUD]);
    const res = await adminSolicitudes.GET(req(A_BASE));
    expect(res.status).toBe(200);
  });

  const APROBAR_BASE = "http://localhost/api/admin/solicitudes/s1/aprobar";

  it("POST aprobar sin permisos → 403 (no toca la base)", async () => {
    withRole(ROLES.COMERCIO as Role);
    const res = await aprobar.POST(
      jsonReq(APROBAR_BASE, "POST", { modo: "nuevo" }),
      ctx("s1"),
    );
    expect(res.status).toBe(403);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("aprobar modo nuevo crea producto maestro y oferta en transacción", async () => {
    withAdmin();
    txMock.solicitudProducto.findUnique.mockResolvedValue(SOLICITUD);
    txMock.producto.findMany.mockResolvedValue([]);
    txMock.producto.create.mockResolvedValue({ id: "pnuevo" });
    txMock.oferta.findUnique.mockResolvedValue(null);
    txMock.oferta.create.mockResolvedValue({ id: "o1" });
    txMock.solicitudProducto.update.mockResolvedValue({
      ...SOLICITUD,
      estado: "APROBADA",
      productoId: "pnuevo",
    });

    const res = await aprobar.POST(
      jsonReq(APROBAR_BASE, "POST", { modo: "nuevo" }),
      ctx("s1"),
    );

    expect(res.status).toBe(200);
    expect(txMock.producto.create).toHaveBeenCalled();
    expect(txMock.oferta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ comercioId: "com1", productoId: "pnuevo" }),
      }),
    );
    expect(txMock.solicitudProducto.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "APROBADA",
          productoId: "pnuevo",
          revisadoById: "adm1",
        }),
      }),
    );
  });

  it("aprobar modo vincular NO crea otro producto maestro", async () => {
    withAdmin();
    txMock.solicitudProducto.findUnique.mockResolvedValue(SOLICITUD);
    txMock.producto.findUnique.mockResolvedValue({ id: "pexistente" });
    txMock.oferta.findUnique.mockResolvedValue(null);
    txMock.oferta.create.mockResolvedValue({ id: "o2" });
    txMock.solicitudProducto.update.mockResolvedValue({
      ...SOLICITUD,
      estado: "VINCULADA",
      productoId: "pexistente",
    });

    const res = await aprobar.POST(
      jsonReq(APROBAR_BASE, "POST", {
        modo: "vincular",
        productoId: "pexistente",
      }),
      ctx("s1"),
    );

    expect(res.status).toBe(200);
    expect(txMock.producto.create).not.toHaveBeenCalled();
    expect(txMock.oferta.create).toHaveBeenCalled();
    expect(txMock.solicitudProducto.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "VINCULADA" }),
      }),
    );
  });

  it("aprobar como nuevo con duplicado detectado → 409 (rollback implícito)", async () => {
    withAdmin();
    txMock.solicitudProducto.findUnique.mockResolvedValue(SOLICITUD);
    txMock.producto.findMany.mockResolvedValue([
      {
        id: "pdup",
        sku: "PDUP",
        nombre: "Tornillo autoperforante 8x2",
        unidad: "caja 100 u",
        marca: "Fijaciones SA",
        fabricante: "Fijaciones SA",
      },
    ]);

    const res = await aprobar.POST(
      jsonReq(APROBAR_BASE, "POST", { modo: "nuevo" }),
      ctx("s1"),
    );

    expect(res.status).toBe(409);
    expect(txMock.producto.create).not.toHaveBeenCalled();
    expect(txMock.oferta.create).not.toHaveBeenCalled();
  });

  it("aprobar solicitud ya procesada → 409", async () => {
    withAdmin();
    txMock.solicitudProducto.findUnique.mockResolvedValue({
      ...SOLICITUD,
      estado: "APROBADA",
    });
    const res = await aprobar.POST(
      jsonReq(APROBAR_BASE, "POST", { modo: "nuevo" }),
      ctx("s1"),
    );
    expect(res.status).toBe(409);
  });

  it("aprobar solicitud inexistente → 404", async () => {
    withAdmin();
    txMock.solicitudProducto.findUnique.mockResolvedValue(null);
    const res = await aprobar.POST(
      jsonReq(APROBAR_BASE, "POST", { modo: "nuevo" }),
      ctx("nope"),
    );
    expect(res.status).toBe(404);
  });

  it("error dentro de la transacción → 500 y no crea oferta", async () => {
    withAdmin();
    txMock.solicitudProducto.findUnique.mockResolvedValue(SOLICITUD);
    txMock.producto.findMany.mockResolvedValue([]);
    txMock.producto.create.mockResolvedValue({ id: "pnuevo" });
    txMock.oferta.findUnique.mockResolvedValue(null);
    txMock.oferta.create.mockRejectedValue(new Error("boom"));

    const res = await aprobar.POST(
      jsonReq(APROBAR_BASE, "POST", { modo: "nuevo" }),
      ctx("s1"),
    );

    expect(res.status).toBe(500);
    expect(txMock.solicitudProducto.update).not.toHaveBeenCalled();
  });

  const RECHAZAR_BASE = "http://localhost/api/admin/solicitudes/s1/rechazar";

  it("rechazar guarda el motivo y el estado RECHAZADA", async () => {
    withAdmin();
    db.solicitudProducto.findUnique.mockResolvedValue(SOLICITUD);
    db.solicitudProducto.updateMany.mockResolvedValue({ count: 1 });
    db.solicitudProducto.findUniqueOrThrow.mockResolvedValue({
      ...SOLICITUD,
      estado: "RECHAZADA",
      motivoRechazo: "Duplicado del catálogo",
    });

    const res = await rechazar.POST(
      jsonReq(RECHAZAR_BASE, "POST", { motivo: "Duplicado del catálogo" }),
      ctx("s1"),
    );

    expect(res.status).toBe(200);
    // El update va condicionado al estado PENDIENTE (anti carrera).
    expect(db.solicitudProducto.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "s1", estado: "PENDIENTE_REVISION" }),
        data: expect.objectContaining({
          estado: "RECHAZADA",
          motivoRechazo: "Duplicado del catálogo",
        }),
      }),
    );
  });

  it("rechazar una solicitud ya procesada (carrera) → 409", async () => {
    withAdmin();
    db.solicitudProducto.findUnique.mockResolvedValue(SOLICITUD);
    db.solicitudProducto.updateMany.mockResolvedValue({ count: 0 });
    const res = await rechazar.POST(
      jsonReq(RECHAZAR_BASE, "POST", { motivo: "Duplicado del catálogo" }),
      ctx("s1"),
    );
    expect(res.status).toBe(409);
  });

  it("rechazar sin motivo → 400", async () => {
    withAdmin();
    const res = await rechazar.POST(
      jsonReq(RECHAZAR_BASE, "POST", { motivo: "" }),
      ctx("s1"),
    );
    expect(res.status).toBe(400);
    expect(db.solicitudProducto.updateMany).not.toHaveBeenCalled();
  });
});
