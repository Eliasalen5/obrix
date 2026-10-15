import { z } from "zod";

const precioSchema = z.number().positive("Precio debe ser mayor a 0");
const stockSchema = z
  .number()
  .int("Stock debe ser un entero")
  .min(-1, "Stock inválido (-1 = sin control)");
const marcaSchema = z.string().trim().max(80, "Máximo 80 caracteres");
const presentacionSchema = z.string().trim().max(80, "Máximo 80 caracteres");

export const createOfertaSchema = z.object({
  productoId: z.string().trim().min(1, "Producto requerido"),
  precio: precioSchema,
  stock: stockSchema.default(0),
  marca: marcaSchema.default(""),
  presentacion: presentacionSchema.default(""),
  activo: z.boolean().default(true),
});

export const updateOfertaSchema = z.object({
  precio: precioSchema.optional(),
  stock: stockSchema.optional(),
  marca: marcaSchema.optional(),
  presentacion: presentacionSchema.optional(),
  activo: z.boolean().optional(),
});

export type CreateOfertaInput = z.infer<typeof createOfertaSchema>;
export type UpdateOfertaInput = z.infer<typeof updateOfertaSchema>;
