import { z } from "zod";

export const createCategoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Nombre requerido (mínimo 2 caracteres)")
    .max(80, "Máximo 80 caracteres"),
  orden: z
    .number()
    .int("Orden debe ser un entero")
    .min(0, "Orden no puede ser negativo")
    .default(0),
});

export const updateCategoriaSchema = createCategoriaSchema.partial();

export const createProductoSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "SKU requerido")
    .max(40, "Máximo 40 caracteres"),
  nombre: z
    .string()
    .trim()
    .min(2, "Nombre requerido (mínimo 2 caracteres)")
    .max(120, "Máximo 120 caracteres"),
  unidad: z
    .string()
    .trim()
    .min(1, "Unidad requerida")
    .max(40, "Máximo 40 caracteres"),
  descripcion: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .default(""),
  categoriaId: z.string().trim().min(1, "Categoría requerida"),
});

export const updateProductoSchema = createProductoSchema.partial();

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;
