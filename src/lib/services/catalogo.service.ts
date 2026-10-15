import { prisma } from "@/lib/prisma";
import type {
  CreateCategoriaInput,
  UpdateCategoriaInput,
  CreateProductoInput,
  UpdateProductoInput,
} from "@/lib/validators/catalogo";

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
  create(data: CreateProductoInput) {
    return prisma.producto.create({ data, include: { categoria: true } });
  },
  update(id: string, data: UpdateProductoInput) {
    return prisma.producto.update({
      where: { id },
      data,
      include: { categoria: true },
    });
  },
  remove(id: string) {
    return prisma.producto.delete({ where: { id } });
  },
};
