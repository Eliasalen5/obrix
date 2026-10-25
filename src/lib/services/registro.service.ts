import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/services/auth.service";
import type {
  RegistroClienteInput,
  SolicitudAltaComercioInput,
} from "@/lib/validators/auth";

export class RegistroError extends Error {
  constructor(public motivo: "EMAIL_EXISTENTE" | "SOLICITUD_EXISTENTE") {
    super(motivo);
  }
}

export const registroService = {
  async registrarCliente(input: RegistroClienteInput) {
    const existente = await prisma.usuario.findUnique({
      where: { email: input.email.toLowerCase() },
      select: { id: true },
    });
    if (existente) throw new RegistroError("EMAIL_EXISTENTE");

    const passwordHash = await hashPassword(input.password);

    const usuario = await prisma.usuario.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        nombre: input.nombre,
        rol: "CLIENTE",
      },
      select: { id: true, email: true, nombre: true, rol: true },
    });

    return usuario;
  },

  async solicitarAltaComercio(input: SolicitudAltaComercioInput) {
    const email = input.email.toLowerCase();

    const existente = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, rol: true },
    });
    if (existente) throw new RegistroError("EMAIL_EXISTENTE");

    const passwordHash = await hashPassword(input.password);

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email,
          passwordHash,
          nombre: input.nombreTitular,
          rol: "CLIENTE",
        },
        select: { id: true, email: true, nombre: true, rol: true },
      });

      const solicitud = await tx.solicitudAltaComercio.create({
        data: {
          solicitanteId: usuario.id,
          nombreFantasia: input.nombreFantasia,
          razonSocial: input.razonSocial ?? "",
          cuit: input.cuit ?? "",
          direccion: input.direccion,
          provincia: input.provincia ?? "",
          localidad: input.localidad ?? "",
          lat: input.lat,
          lng: input.lng,
          telefonoComercial: input.telefonoComercial,
          telefonoTitular: input.telefonoTitular,
          rubro: input.rubro ?? "",
          categorias: input.categorias ?? [],
          estado: "PENDIENTE",
        },
      });

      return { usuario, solicitud };
    });

    return result;
  },

  async listarSolicitudesAlta(estado?: string) {
    return prisma.solicitudAltaComercio.findMany({
      where: estado ? { estado } : undefined,
      include: {
        solicitante: { select: { id: true, email: true, nombre: true, createdAt: true } },
        revisadoBy: { select: { id: true, nombre: true, email: true } },
        comercio: { select: { id: true, activo: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async obtenerSolicitudAlta(id: string) {
    return prisma.solicitudAltaComercio.findUnique({
      where: { id },
      include: {
        solicitante: { select: { id: true, email: true, nombre: true, createdAt: true } },
        revisadoBy: { select: { id: true, nombre: true, email: true } },
        comercio: true,
      },
    });
  },

  async aprobarSolicitudAlta(id: string, revisadoById: string) {
    const solicitud = await prisma.solicitudAltaComercio.findUnique({
      where: { id },
      include: { solicitante: true },
    });
    if (!solicitud) return { ok: false as const, motivo: "NO_ENCONTRADO" as const };
    if (solicitud.estado !== "PENDIENTE") return { ok: false as const, motivo: "YA_RESUELTA" as const };

    const result = await prisma.$transaction(async (tx) => {
      const comercio = await tx.comercio.create({
        data: {
          nombre: solicitud.nombreFantasia,
          direccion: solicitud.direccion,
          lat: solicitud.lat,
          lng: solicitud.lng,
          telefono: solicitud.telefonoComercial || solicitud.telefonoTitular,
          activo: true,
          ownerId: solicitud.solicitanteId,
        },
      });

      await tx.usuario.update({
        where: { id: solicitud.solicitanteId },
        data: { rol: "COMERCIO" },
      });

      const actualizada = await tx.solicitudAltaComercio.update({
        where: { id: solicitud.id },
        data: {
          estado: "APROBADA",
          revisadoById,
          comercioId: comercio.id,
          motivoRechazo: "",
        },
        include: {
          solicitante: { select: { id: true, email: true, nombre: true } },
          comercio: true,
        },
      });

      return actualizada;
    });

    return { ok: true as const, solicitud: result };
  },

  async rechazarSolicitudAlta(id: string, revisadoById: string, motivo: string) {
    const solicitud = await prisma.solicitudAltaComercio.findUnique({
      where: { id },
    });
    if (!solicitud) return { ok: false as const, motivo: "NO_ENCONTRADO" as const };
    if (solicitud.estado !== "PENDIENTE") return { ok: false as const, motivo: "YA_RESUELTA" as const };

    const actualizada = await prisma.solicitudAltaComercio.update({
      where: { id: solicitud.id },
      data: {
        estado: "RECHAZADA",
        revisadoById,
        motivoRechazo: motivo,
        comercioId: null,
      },
      include: {
        solicitante: { select: { id: true, email: true, nombre: true } },
      },
    });

    return { ok: true as const, solicitud: actualizada };
  },

  async obtenerSolicitudPorSolicitante(solicitanteId: string) {
    return prisma.solicitudAltaComercio.findUnique({
      where: { solicitanteId },
    });
  },
};
