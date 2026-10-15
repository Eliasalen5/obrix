import { z } from "zod";

export const DESCRIPCION_MIN = 10;
export const DESCRIPCION_MAX = 2000;
export const CANTIDAD_MAX = 1_000_000;

export const asistenteRequestSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(
      DESCRIPCION_MIN,
      `Contá tu proyecto con un poco más de detalle (mínimo ${DESCRIPCION_MIN} caracteres)`,
    )
    .max(
      DESCRIPCION_MAX,
      `La descripción es demasiado larga (máximo ${DESCRIPCION_MAX} caracteres)`,
    ),
});

export const materialEstimadoSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre de material requerido").max(120),
  cantidad: z
    .number()
    .positive("La cantidad debe ser mayor a 0")
    .max(CANTIDAD_MAX, "La cantidad es demasiado grande"),
  unidad: z.string().trim().min(1, "Unidad requerida").max(40),
  notas: z.string().trim().max(200).optional(),
});

export const proyectoEstimadoSchema = z.object({
  titulo: z.string().trim().min(1, "Título requerido").max(160),
  materiales: z.array(materialEstimadoSchema).max(80),
  supuestos: z.array(z.string().trim().min(1).max(300)).max(30),
  aclaraciones: z.array(z.string().trim().min(1).max(300)).max(30),
});

export const asistenteResponseSchema = proyectoEstimadoSchema.extend({
  esEstimacion: z.literal(true),
  modo: z.enum(["demo", "real"]),
  aviso: z.string().min(1),
});

export type AsistenteRequest = z.infer<typeof asistenteRequestSchema>;
export type MaterialEstimado = z.infer<typeof materialEstimadoSchema>;
export type ProyectoEstimado = z.infer<typeof proyectoEstimadoSchema>;
export type AsistenteResponse = z.infer<typeof asistenteResponseSchema>;
