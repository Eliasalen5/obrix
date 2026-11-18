import {
  includeOfertaPublica,
  type OfertaPublica,
} from "@/lib/ofertas/buscarOfertas";
import { prisma } from "@/lib/prisma";
import { getPlan, limiteProductosDePlan } from "@/lib/planes";
import type {
  CreateOfertaInput,
  UpdateOfertaInput,
} from "@/lib/validators/oferta";

/** Error de dominio mapeable a HTTP por las rutas. */
export class OfertaError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "OfertaError";
  }
}

const includeProducto = {
  producto: { include: { categoria: true, subcategoria: true } },
} as const;

/** Oferta pública por id, solo si está activa y su comercio está activo. */
export async function obtenerOfertaPublica(
  id: string,
): Promise<OfertaPublica | null> {
  return prisma.oferta.findFirst({
    where: { id, activo: true, comercio: { activo: true } },
    include: includeOfertaPublica,
  });
}

export const ofertaService = {
  listByComercio(comercioId: string) {
    return prisma.oferta.findMany({
      where: { comercioId },
      include: includeProducto,
      orderBy: { updatedAt: "desc" },
    });
  },

  getForComercio(comercioId: string, id: string) {
    return prisma.oferta.findFirst({
      where: { id, comercioId },
      include: includeProducto,
    });
  },

  async upsertForComercio(comercioId: string, data: CreateOfertaInput) {
    const { productoId, ...rest } = data;

    const existente = await prisma.oferta.findUnique({
      where: { comercioId_productoId: { comercioId, productoId } },
      select: { id: true },
    });

    // El límite de productos del plan solo aplica a publicaciones nuevas.
    if (!existente) {
      const comercio = await prisma.comercio.findUnique({
        where: { id: comercioId },
        select: { plan: true },
      });
      const limite = limiteProductosDePlan(comercio?.plan);
      if (limite !== null) {
        const total = await prisma.oferta.count({ where: { comercioId } });
        if (total >= limite) {
          throw new OfertaError(
            403,
            `Alcanzaste el límite de ${limite} productos del plan ${getPlan(
              comercio?.plan,
            ).nombre}. Mejorá tu plan para publicar más.`,
          );
        }
      }
    }

    return prisma.oferta.upsert({
      where: { comercioId_productoId: { comercioId, productoId } },
      create: { comercioId, productoId, ...rest },
      update: rest,
      include: includeProducto,
    });
  },

  updateForComercio(comercioId: string, id: string, data: UpdateOfertaInput) {
    return prisma.oferta.updateMany({
      where: { id, comercioId },
      data,
    });
  },

  removeForComercio(comercioId: string, id: string) {
    return prisma.oferta.deleteMany({
      where: { id, comercioId },
    });
  },
};
