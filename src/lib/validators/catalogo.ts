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

// Id opcional: la cadena vacía del formulario se normaliza a `undefined`.
const subcategoriaIdSchema = z.preprocess(
  (valor) =>
    typeof valor === "string" && valor.trim() === "" ? undefined : valor,
  z
    .string()
    .trim()
    .max(40, "Máximo 40 caracteres")
    .optional(),
);

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
  subcategoriaId: subcategoriaIdSchema,
});

export const updateProductoSchema = createProductoSchema.partial();

const numeroQuery = (defecto: number, min: number, max: number) =>
  z.preprocess(
    (valor) =>
      valor === "" || valor === null || valor === undefined ? undefined : valor,
    z.coerce.number().int().min(min).max(max).default(defecto),
  );

export const listProductosQuerySchema = z.object({
  q: z.string().trim().max(120, "Máximo 120 caracteres").default(""),
  categoriaId: z
    .string()
    .trim()
    .max(40, "Máximo 40 caracteres")
    .default(""),
  subcategoriaId: z
    .string()
    .trim()
    .max(40, "Máximo 40 caracteres")
    .default(""),
  limit: numeroQuery(50, 1, 200),
  offset: numeroQuery(0, 0, 1_000_000),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;
export type ListProductosQueryInput = z.infer<typeof listProductosQuerySchema>;
