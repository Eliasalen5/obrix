import { prisma } from "@/lib/prisma";
import { prismaErrorCode } from "@/lib/api/http";
import { normalizarTexto } from "@/lib/services/cotizador.service";
import type { Prisma } from "@/generated/prisma/client";
import {
  detectarCoincidencias,
  type Coincidencia,
} from "@/lib/services/duplicados.service";
import {
  ESTADOS_SOLICITUD,
  propuestaProductoSchema,
  type AprobarSolicitudInput,
  type EstadoSolicitud,
  type PropuestaProductoInput,
} from "@/lib/validators/solicitud";

/**
 * Error HTTP mapeable para las rutas que consumen el servicio.
 * Se usa `status` como código HTTP y `revisadoPor` (en aprobar/rechazar)
 * recibe el id del administrador autenticado.
 */
export class SolicitudError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "SolicitudError";
  }
}

export type SolicitudConRelaciones = {
  id: string;
  comercioId: string;
  estado: string;
  datos: unknown;
  clavePendiente: string | null;
  productoId: string | null;
  motivoRechazo: string;
  revisadoById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function claveDePropuesta(propuesta: PropuestaProductoInput): string {
  return [
    propuesta.nombre,
    propuesta.unidad,
    propuesta.marca,
    propuesta.fabricante,
  ]
    .filter(Boolean)
    .map((t) => normalizarTexto(t))
    .join(" ")
    .trim();
}

function skuGenerado(solicitudId: string, nombre: string): string {
  const base =
    normalizarTexto(nombre)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "producto";
  return `${base}-${solicitudId.slice(-6).toUpperCase()}`.toUpperCase();
}

function parsearPropuesta(datos: unknown): PropuestaProductoInput {
  const parsed = propuestaProductoSchema.safeParse(datos);
  if (!parsed.success) {
    throw new SolicitudError(500, "Los datos guardados de la solicitud son inválidos");
  }
  return parsed.data;
}

function aJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const solicitudService = {
  /**
   * Crea una solicitud de producto nuevo.
   * Nivel 1 y 2 (coincidencia confiable/normalizada) → SolicitudError 409 con
   * las coincidencias, para que el comercio oferte el producto existente.
   * Nivel 3 (aproximado) → se crea la solicitud y se devuelve aviso.
   */
  async crear(comercioId: string, propuesta: PropuestaProductoInput) {
    const productos = await prisma.producto.findMany({});
    const coincidencias = detectarCoincidencias(propuesta, productos);

    const bloqueantes = coincidencias.filter((c) => c.nivel !== "aproximada");
    if (bloqueantes.length > 0) {
      throw new SolicitudError(
        409,
        "El producto ya existe en el catálogo maestro",
        { coincidencias: bloqueantes.map((c) => c.producto) },
      );
    }

    try {
      const solicitud = await prisma.solicitudProducto.create({
        data: {
          comercioId,
          estado: ESTADOS_SOLICITUD.PENDIENTE,
          datos: propuesta as unknown as Prisma.InputJsonValue,
          clavePendiente: claveDePropuesta(propuesta),
        },
        include: { comercio: { select: { id: true, nombre: true } } },
      });
      return {
        solicitud,
        posiblesDuplicados: coincidencias.map((c) => c.producto),
      };
    } catch (error) {
      // Unicidad [comercioId, clavePendiente]: envíos repetidos/concurrentes
      if (prismaErrorCode(error) === "P2002") {
        throw new SolicitudError(
          409,
          "Ya enviaste una solicitud similar que está pendiente de revisión",
        );
      }
      throw error;
    }
  },

  listarPorComercio(comercioId: string, estado?: string) {
    return prisma.solicitudProducto.findMany({
      where: {
        comercioId,
        ...(estado ? { estado } : {}),
      },
      include: {
        producto: { select: { id: true, sku: true, nombre: true, unidad: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  listarAdmin(estado?: string) {
    return prisma.solicitudProducto.findMany({
      where: estado ? { estado } : {},
      include: {
        comercio: { select: { id: true, nombre: true, direccion: true } },
        producto: { select: { id: true, sku: true, nombre: true, unidad: true } },
        revisadoBy: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  get(id: string) {
    return prisma.solicitudProducto.findUnique({
      where: { id },
      include: {
        comercio: { select: { id: true, nombre: true, direccion: true } },
        producto: { select: { id: true, sku: true, nombre: true, unidad: true } },
      },
    });
  },

  /**
   * Aprueba una solicitud dentro de una transacción:
   * - modo "nuevo": re-chequea duplicados, crea el producto maestro y la oferta
   *   inicial del comercio proponente.
   * - modo "vincular": reutiliza el producto existente y solo crea la oferta.
   * Si algo falla, no queda ningún registro a medias.
   */
  async aprobar(
    solicitudId: string,
    input: AprobarSolicitudInput,
    adminId?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudProducto.findUnique({
        where: { id: solicitudId },
      });
      if (!solicitud) {
        throw new SolicitudError(404, "Solicitud no encontrada");
      }
      if (solicitud.estado !== ESTADOS_SOLICITUD.PENDIENTE) {
        throw new SolicitudError(409, "La solicitud ya fue procesada");
      }

      const propuesta = parsearPropuesta(solicitud.datos);
      let productoId: string;
      let nuevoEstado: EstadoSolicitud;

      if (input.modo === "vincular") {
        const existente = await tx.producto.findUnique({
          where: { id: input.productoId },
        });
        if (!existente) {
          throw new SolicitudError(404, "El producto indicado no existe");
        }
        productoId = existente.id;
        nuevoEstado = ESTADOS_SOLICITUD.VINCULADA;
      } else {
        // Re-chequeo de duplicados en el momento de aprobar: solo bloquean las
        // coincidencias confiables (nivel exacto/normalizado). Las aproximadas
        // son solo sugerencias (igual criterio que en `crear`), así que se
        // permiten sin afectar el flujo del admin.
        const productos = await tx.producto.findMany({});
        const duplicados: Coincidencia[] = detectarCoincidencias(
          propuesta,
          productos,
        ).filter((c) => c.nivel !== "aproximada");
        if (duplicados.length > 0) {
          throw new SolicitudError(
            409,
            "Ya existe un producto equivalente en el catálogo; vinculá la solicitud",
            { coincidencias: duplicados.map((c) => c.producto) },
          );
        }

        const creado = await tx.producto.create({
          data: {
            sku: skuGenerado(solicitud.id, propuesta.nombre),
            nombre: propuesta.nombre,
            unidad: propuesta.unidad,
            descripcion: propuesta.descripcion,
            categoriaId: propuesta.categoriaId,
            codigoBarras: propuesta.codigoBarras || null,
            fabricante: propuesta.fabricante,
            codigoFabricante: propuesta.codigoFabricante || null,
            marca: propuesta.marca,
            atributos:
              Object.keys(propuesta.atributos).length > 0
                ? aJson(propuesta.atributos)
                : undefined,
          },
        });
        productoId = creado.id;
        nuevoEstado = ESTADOS_SOLICITUD.APROBADA;
      }

      // Oferta inicial del comercio proponente (sin pisar una existente)
      const ofertaExistente = await tx.oferta.findUnique({
        where: {
          comercioId_productoId: {
            comercioId: solicitud.comercioId,
            productoId,
          },
        },
      });
      if (!ofertaExistente) {
        await tx.oferta.create({
          data: {
            comercioId: solicitud.comercioId,
            productoId,
            precio: propuesta.precio,
            stock: propuesta.stock,
            marca: propuesta.marca,
            presentacion: propuesta.unidad,
          },
        });
      }

      const actualizada = await tx.solicitudProducto.update({
        where: { id: solicitud.id },
        data: {
          estado: nuevoEstado,
          productoId,
          clavePendiente: null,
          revisadoById: adminId,
        },
        include: {
          comercio: { select: { id: true, nombre: true } },
          producto: { select: { id: true, sku: true, nombre: true, unidad: true } },
        },
      });

      return { solicitud: actualizada, productoId };
    });
  },

  async rechazar(solicitudId: string, motivo: string, adminId?: string) {
    const existente = await prisma.solicitudProducto.findUnique({
      where: { id: solicitudId },
      select: { id: true, estado: true },
    });
    if (!existente) {
      throw new SolicitudError(404, "Solicitud no encontrada");
    }
    if (existente.estado !== ESTADOS_SOLICITUD.PENDIENTE) {
      throw new SolicitudError(409, "La solicitud ya fue procesada");
    }

    // Condicionado al estado PENDIENTE para evitar carreras con `aprobar`:
    // si otra revisión ya la procesó, no pisamos el resultado.
    const resultado = await prisma.solicitudProducto.updateMany({
      where: { id: solicitudId, estado: ESTADOS_SOLICITUD.PENDIENTE },
      data: {
        estado: ESTADOS_SOLICITUD.RECHAZADA,
        motivoRechazo: motivo,
        clavePendiente: null,
        revisadoById: adminId,
      },
    });
    if (resultado.count === 0) {
      throw new SolicitudError(409, "La solicitud ya fue procesada");
    }

    return prisma.solicitudProducto.findUniqueOrThrow({
      where: { id: solicitudId },
      include: {
        comercio: { select: { id: true, nombre: true } },
        producto: { select: { id: true, sku: true, nombre: true, unidad: true } },
      },
    });
  },
};
