import { prisma } from "@/lib/prisma";
import type {
  CreateOfertaInput,
  UpdateOfertaInput,
} from "@/lib/validators/oferta";

const includeProducto = {
  producto: { include: { categoria: true } },
} as const;

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
