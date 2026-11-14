import { prisma } from "@/lib/prisma";
import {
  construirBusquedaProducto,
  normalizarClave,
} from "@/lib/text/busqueda";
import type {
  CreateCategoriaInput,
  UpdateCategoriaInput,
  CreateProductoInput,
  UpdateProductoInput,
} from "@/lib/validators/catalogo";

/** Error de dominio mapeable a HTTP por las rutas. */
export class CatalogoError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CatalogoError";
  }
}

export type BuscarProductosInput = {
  q?: string;
  categoriaId?: string;
  subcategoriaId?: string;
  limit: number;
  offset: number;
};

const includeProducto = {
  categoria: true,
  subcategoria: true,
} as const;

/**
 * Verifica que la subcategoría exista y pertenezca a la categoría indicada.
 * Devuelve el id validado o `null` si no se pidió subcategoría.
 */
async function validarSubcategoria(
  categoriaId: string,
  subcategoriaId?: string | null,
): Promise<string | null> {
  if (!subcategoriaId) return null;

  const subcategoria = await prisma.subcategoria.findUnique({
    where: { id: subcategoriaId },
    select: { categoriaId: true },
  });
  if (!subcategoria) {
    throw new CatalogoError(400, "La subcategoría indicada no existe");
  }
  if (subcategoria.categoriaId !== categoriaId) {
    throw new CatalogoError(
      400,
      "La subcategoría no pertenece a la categoría indicada",
    );
  }
  return subcategoriaId;
}

export const categoriaService = {
  list() {
    return prisma.categoria.findMany({
      orderBy: { orden: "asc" },
      include: { subcategorias: { orderBy: { orden: "asc" } } },
    });
  },
  get(id: string) {
    return prisma.categoria.findUnique({
      where: { id },
      include: { subcategorias: { orderBy: { orden: "asc" } } },
    });
  },
  create(data: CreateCategoriaInput) {
    return prisma.categoria.create({ data });
  },
  update(id: string, data: UpdateCategoriaInput) {
    return prisma.categoria.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.categoria.delete({ where: { id } });
  },
};

export const productoService = {
  list() {
    return prisma.producto.findMany({
      include: includeProducto,
      orderBy: { nombre: "asc" },
    });
  },
  get(id: string) {
    return prisma.producto.findUnique({
      where: { id },
      include: includeProducto,
    });
  },
  async search({
    q = "",
    categoriaId = "",
    subcategoriaId = "",
    limit,
    offset,
  }: BuscarProductosInput) {
    const tokens = [
      ...new Set(normalizarClave(q).split(" ").filter(Boolean)),
    ];
    const where = {
      ...(categoriaId ? { categoriaId } : {}),
      ...(subcategoriaId ? { subcategoriaId } : {}),
      ...(tokens.length > 0
        ? { AND: tokens.map((token) => ({ busqueda: { contains: token } })) }
        : {}),
    };

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: includeProducto,
        orderBy: { nombre: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.producto.count({ where }),
    ]);

    return { productos, total };
  },
  async create(data: CreateProductoInput) {
    const subcategoriaId = await validarSubcategoria(
      data.categoriaId,
      data.subcategoriaId,
    );
    return prisma.producto.create({
      data: {
        ...data,
        subcategoriaId,
        busqueda: construirBusquedaProducto(data),
      },
      include: includeProducto,
    });
  },
  async update(id: string, data: UpdateProductoInput) {
    const actual = await prisma.producto.findUnique({ where: { id } });
    const categoriaId = data.categoriaId ?? actual?.categoriaId ?? "";
    const busqueda = construirBusquedaProducto({
      sku: data.sku ?? actual?.sku,
      nombre: data.nombre ?? actual?.nombre,
      unidad: data.unidad ?? actual?.unidad,
      descripcion: data.descripcion ?? actual?.descripcion,
      marca: actual?.marca,
      fabricante: actual?.fabricante,
      codigoFabricante: actual?.codigoFabricante,
      codigoBarras: actual?.codigoBarras,
    });

    let subcategoriaId: string | null | undefined;
    if (data.subcategoriaId !== undefined) {
      subcategoriaId = await validarSubcategoria(
        categoriaId,
        data.subcategoriaId,
      );
    } else if (data.categoriaId !== undefined && actual?.subcategoriaId) {
      // Cambió la categoría sin indicar subcategoría: se conserva solo si sigue
      // perteneciendo a la nueva categoría.
      const subcategoria = await prisma.subcategoria.findUnique({
        where: { id: actual.subcategoriaId },
        select: { categoriaId: true },
      });
      subcategoriaId =
        subcategoria?.categoriaId === categoriaId
          ? actual.subcategoriaId
          : null;
    }

    return prisma.producto.update({
      where: { id },
      data: {
        ...data,
        busqueda,
        ...(subcategoriaId !== undefined ? { subcategoriaId } : {}),
      },
      include: includeProducto,
    });
  },
  remove(id: string) {
    return prisma.producto.delete({ where: { id } });
  },
};
