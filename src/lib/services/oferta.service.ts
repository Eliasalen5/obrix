import {
  includeOfertaPublica,
  type OfertaPublica,
} from "@/lib/ofertas/buscarOfertas";
import { prisma } from "@/lib/prisma";
import type {
  CreateOfertaInput,
  UpdateOfertaInput,
} from "@/lib/validators/oferta";

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

  upsertForComercio(comercioId: string, data: CreateOfertaInput) {
    const { productoId, ...rest } = data;
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
