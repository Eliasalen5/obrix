import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizarClave } from "@/lib/text/busqueda";

export const includeOfertaPublica = {
  producto: { include: { categoria: true, subcategoria: true } },
  comercio: {
    select: {
      id: true,
      nombre: true,
      direccion: true,
      localidad: true,
      provincia: true,
    },
  },
} satisfies Prisma.OfertaInclude;

export type OfertaPublica = Prisma.OfertaGetPayload<{
  include: typeof includeOfertaPublica;
}>;

export type FiltrosOfertasPublicas = {
  q?: string;
  categoria?: string;
  subcategoria?: string;
  comercioId?: string;
  take?: number;
};

/** Ofertas visibles en la web pública: solo activas y de comercios activos. */
export async function buscarOfertasPublicas({
  q = "",
  categoria = "",
  subcategoria = "",
  comercioId = "",
  take = 60,
}: FiltrosOfertasPublicas = {}): Promise<OfertaPublica[]> {
  const tokens = [
    ...new Set(normalizarClave(q.trim()).split(" ").filter(Boolean)),
  ];
  const where: Prisma.OfertaWhereInput = {
    activo: true,
    comercio: { activo: true },
  };

  const productoFiltro: Prisma.ProductoWhereInput = {};
  if (categoria) {
    productoFiltro.categoria = {
      nombre: { equals: categoria.trim(), mode: "insensitive" },
    };
  }
  if (subcategoria) {
    productoFiltro.subcategoria = {
      nombre: { equals: subcategoria.trim(), mode: "insensitive" },
    };
  }
  if (Object.keys(productoFiltro).length > 0) {
    where.producto = productoFiltro;
  }
  if (comercioId) where.comercioId = comercioId.trim();

  if (tokens.length > 0) {
    where.AND = tokens.map((token) => ({
      OR: [
        { producto: { busqueda: { contains: token } } },
        { producto: { nombre: { contains: token, mode: "insensitive" } } },
        { producto: { marca: { contains: token, mode: "insensitive" } } },
        { comercio: { nombre: { contains: token, mode: "insensitive" } } },
      ],
    }));
  }

  return prisma.oferta.findMany({
    where,
    include: includeOfertaPublica,
    orderBy: { updatedAt: "desc" },
    take: Math.min(Math.max(Math.floor(take), 1), 60),
  });
}
