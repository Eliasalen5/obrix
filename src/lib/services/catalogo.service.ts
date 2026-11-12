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

export type BuscarProductosInput = {
  q?: string;
  categoriaId?: string;
  limit: number;
  offset: number;
};

export const categoriaService = {
  list() {
    return prisma.categoria.findMany({ orderBy: { orden: "asc" } });
  },
  get(id: string) {
    return prisma.categoria.findUnique({ where: { id } });
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
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    });
  },
  get(id: string) {
    return prisma.producto.findUnique({
      where: { id },
      include: { categoria: true },
    });
  },
  async search({ q = "", categoriaId = "", limit, offset }: BuscarProductosInput) {
    const tokens = [
      ...new Set(normalizarClave(q).split(" ").filter(Boolean)),
    ];
    const where = {
      ...(categoriaId ? { categoriaId } : {}),
      ...(tokens.length > 0
        ? { AND: tokens.map((token) => ({ busqueda: { contains: token } })) }
        : {}),
    };

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: { categoria: true },
        orderBy: { nombre: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.producto.count({ where }),
    ]);

    return { productos, total };
  },
  create(data: CreateProductoInput) {
    return prisma.producto.create({
      data: { ...data, busqueda: construirBusquedaProducto(data) },
      include: { categoria: true },
    });
  },
  async update(id: string, data: UpdateProductoInput) {
    const actual = await prisma.producto.findUnique({ where: { id } });
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
    return prisma.producto.update({
      where: { id },
      data: { ...data, busqueda },
      include: { categoria: true },
    });
  },
  remove(id: string) {
    return prisma.producto.delete({ where: { id } });
  },
};
