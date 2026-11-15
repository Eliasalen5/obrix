import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveIdentity } from "@/lib/auth/token";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as solicitudComercio from "@/app/api/v1/auth/solicitud-comercio/route";
import * as adminSolicitudesAlta from "@/app/api/v1/admin/solicitudes-alta/route";
import * as aprobarAlta from "@/app/api/v1/admin/solicitudes-alta/[id]/aprobar/route";
import * as rechazarAlta from "@/app/api/v1/admin/solicitudes-alta/[id]/rechazar/route";

vi.mock("@/lib/auth/token", () => ({
  resolveIdentity: vi.fn(),
}));

const txMock = {
  usuario: { update: vi.fn() },
  comercio: { create: vi.fn() },
  solicitudAltaComercio: { update: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    solicitudAltaComercio: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

type DbMock = {
  solicitudAltaComercio: Record<"findMany" | "findUnique" | "update", Mock>;
  $transaction: Mock;
};

const sessionMock = resolveIdentity as unknown as Mock;
const db = prisma as unknown as DbMock;

const SOLICITUD = {
  id: "sol1",
  solicitanteId: "u1",
  estado: "PENDIENTE",
  nombreFantasia: "Ferretería Centro",
  direccion: "Av. Siempre Viva 123",
  lat: -34.6037,
  lng: -58.3816,
  telefonoComercial: "1123456789",
  telefonoTitular: "1198765432",
  solicitante: {
    id: "u1",
    email: "comercio@mail.com",
    nombre: "Juan Pérez",
  },
};

const ACTUALIZACION = {
  nombreTitular: "Juan Pérez",
  telefonoTitular: "1198765432",
  nombreFantasia: "Ferretería Actualizada",
  razonSocial: "Ferretería SA",
  cuit: "30-12345678-9",
  direccion: "Av. Corrientes 500",
  provincia: "Buenos Aires",
  localidad: "La Plata",
  lat: -34.9214,
  lng: -57.9544,
  telefonoComercial: "2214567890",
  rubro: "Ferretería",
  categorias: [],
};

function withRole(role: Role, userId = "u1") {
  sessionMock.mockResolvedValue({ userId, role });
}

function req(url: string) {
  return new Request(url) as unknown as NextRequest;
}

function jsonReq(
  url: string,
  body: unknown,
  method: "POST" | "PUT" = "PUT",
) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  db.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
    cb(txMock),
  );
});

describe("admin — listado de altas de comercio", () => {
  it("requiere autenticación", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await adminSolicitudesAlta.GET(
      req("http://localhost/api/v1/admin/solicitudes-alta"),
    );
    expect(res.status).toBe(401);
  });

  it("rechaza a un comercio", async () => {
    withRole(ROLES.COMERCIO);
    const res = await adminSolicitudesAlta.GET(
      req("http://localhost/api/v1/admin/solicitudes-alta"),
    );
    expect(res.status).toBe(403);
  });

  it("lista las solicitudes pendientes para un admin", async () => {
    withRole(ROLES.ADMIN, "adm1");
    db.solicitudAltaComercio.findMany.mockResolvedValue([SOLICITUD]);

    const res = await adminSolicitudesAlta.GET(
      req("http://localhost/api/v1/admin/solicitudes-alta?estado=PENDIENTE"),
    );

    expect(res.status).toBe(200);
    expect(db.solicitudAltaComercio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { estado: "PENDIENTE" } }),
    );
  });
});

describe("admin — aprobar o rechazar alta de comercio", () => {
  it("aprueba, crea el comercio activo y cambia el rol del titular", async () => {
    withRole(ROLES.ADMIN, "adm1");
    db.solicitudAltaComercio.findUnique.mockResolvedValue(SOLICITUD);
    txMock.comercio.create.mockResolvedValue({ id: "com1", activo: true });
    txMock.solicitudAltaComercio.update.mockResolvedValue({
      ...SOLICITUD,
      estado: "APROBADA",
      comercioId: "com1",
      revisadoById: "adm1",
    });

    const res = await aprobarAlta.POST(
      req("http://localhost/api/v1/admin/solicitudes-alta/sol1/aprobar"),
      ctx("sol1"),
    );

    expect(res.status).toBe(200);
    expect(txMock.comercio.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ownerId: "u1", activo: true }),
    });
    expect(txMock.usuario.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { rol: "COMERCIO" },
    });
    expect(txMock.solicitudAltaComercio.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sol1" },
        data: expect.objectContaining({
          estado: "APROBADA",
          comercioId: "com1",
          revisadoById: "adm1",
        }),
      }),
    );
    const body = await res.json();
    expect(body.data.estado).toBe("APROBADA");
  });

  it("no permite aprobar una solicitud ya resuelta", async () => {
    withRole(ROLES.ADMIN, "adm1");
    db.solicitudAltaComercio.findUnique.mockResolvedValue({
      ...SOLICITUD,
      estado: "APROBADA",
    });

    const res = await aprobarAlta.POST(
      req("http://localhost/api/v1/admin/solicitudes-alta/sol1/aprobar"),
      ctx("sol1"),
    );

    expect(res.status).toBe(409);
    expect(txMock.comercio.create).not.toHaveBeenCalled();
  });

  it("rechaza con motivo sin crear un comercio ni cambiar el rol", async () => {
    withRole(ROLES.ADMIN, "adm1");
    db.solicitudAltaComercio.findUnique.mockResolvedValue(SOLICITUD);
    db.solicitudAltaComercio.update.mockResolvedValue({
      ...SOLICITUD,
      estado: "RECHAZADA",
      motivoRechazo: "Datos incompletos",
    });

    const res = await rechazarAlta.POST(
      jsonReq("http://localhost/api/v1/admin/solicitudes-alta/sol1/rechazar", {
        motivo: "Datos incompletos",
      }, "POST"),
      ctx("sol1"),
    );

    expect(res.status).toBe(200);
    expect(db.solicitudAltaComercio.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "RECHAZADA",
          motivoRechazo: "Datos incompletos",
          revisadoById: "adm1",
          comercioId: null,
        }),
      }),
    );
    expect(txMock.comercio.create).not.toHaveBeenCalled();
    expect(txMock.usuario.update).not.toHaveBeenCalled();
  });

  it("valida el motivo del rechazo", async () => {
    withRole(ROLES.ADMIN, "adm1");
    const res = await rechazarAlta.POST(
      jsonReq("http://localhost/api/v1/admin/solicitudes-alta/sol1/rechazar", {
        motivo: "no",
      }, "POST"),
      ctx("sol1"),
    );
    expect(res.status).toBe(400);
    expect(db.solicitudAltaComercio.update).not.toHaveBeenCalled();
  });
});

describe("titular — corregir y reenviar una solicitud rechazada", () => {
  const url = "http://localhost/api/v1/auth/solicitud-comercio";

  it("requiere autenticación", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await solicitudComercio.PUT(jsonReq(url, ACTUALIZACION));
    expect(res.status).toBe(401);
  });

  it("no permite reenviar con otro rol", async () => {
    withRole(ROLES.COMERCIO);
    const res = await solicitudComercio.PUT(jsonReq(url, ACTUALIZACION));
    expect(res.status).toBe(403);
  });

  it("rechaza una actualización inválida", async () => {
    withRole(ROLES.CLIENTE);
    const res = await solicitudComercio.PUT(
      jsonReq(url, { ...ACTUALIZACION, direccion: "" }),
    );
    expect(res.status).toBe(400);
    expect(db.solicitudAltaComercio.update).not.toHaveBeenCalled();
  });

  it("solo permite actualizar la solicitud rechazada del usuario autenticado", async () => {
    withRole(ROLES.CLIENTE, "u1");
    db.solicitudAltaComercio.findUnique.mockResolvedValue({
      id: "sol1",
      estado: "RECHAZADA",
    });
    txMock.solicitudAltaComercio.update.mockResolvedValue({
      ...ACTUALIZACION,
      id: "sol1",
      solicitanteId: "u1",
      estado: "PENDIENTE",
    });

    const res = await solicitudComercio.PUT(
      jsonReq(url, {
        ...ACTUALIZACION,
        email: "otro@mail.com",
        password: "nueva-clave-123",
        solicitanteId: "otro-usuario",
      }),
    );

    expect(res.status).toBe(200);
    expect(db.solicitudAltaComercio.findUnique).toHaveBeenCalledWith({
      where: { solicitanteId: "u1" },
      select: { id: true, estado: true },
    });
    expect(txMock.usuario.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { nombre: "Juan Pérez" },
    });
    const updateArgs = txMock.solicitudAltaComercio.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: "sol1" });
    expect(updateArgs.data).toEqual(
      expect.objectContaining({
        estado: "PENDIENTE",
        nombreFantasia: "Ferretería Actualizada",
        motivoRechazo: "",
        revisadoById: null,
        comercioId: null,
      }),
    );
    expect(updateArgs.data).not.toHaveProperty("email");
    expect(updateArgs.data).not.toHaveProperty("password");
    expect(updateArgs.data).not.toHaveProperty("solicitanteId");
    const body = await res.json();
    expect(body.data.estado).toBe("PENDIENTE");
  });

  it.each(["PENDIENTE", "APROBADA"])(
    "no permite reenviar una solicitud en estado %s",
    async (estado) => {
      withRole(ROLES.CLIENTE);
      db.solicitudAltaComercio.findUnique.mockResolvedValue({
        id: "sol1",
        estado,
      });
      const res = await solicitudComercio.PUT(jsonReq(url, ACTUALIZACION));
      expect(res.status).toBe(409);
      expect(txMock.solicitudAltaComercio.update).not.toHaveBeenCalled();
    },
  );

  it("devuelve 404 si el usuario no tiene solicitud", async () => {
    withRole(ROLES.CLIENTE);
    db.solicitudAltaComercio.findUnique.mockResolvedValue(null);
    const res = await solicitudComercio.PUT(jsonReq(url, ACTUALIZACION));
    expect(res.status).toBe(404);
  });
});
