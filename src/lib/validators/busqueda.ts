import { z } from "zod";

export const CONSULTA_MIN = 3;
export const CONSULTA_MAX = 300;

export const busquedaIaRequestSchema = z.object({
  consulta: z
    .string()
    .trim()
    .min(
      CONSULTA_MIN,
      `Contanos qué estás buscando (mínimo ${CONSULTA_MIN} caracteres)`,
    )
    .max(
      CONSULTA_MAX,
      `La búsqueda es demasiado larga (máximo ${CONSULTA_MAX} caracteres)`,
    ),
});

/** Salida cruda de la IA (se valida antes de usarla). */
export const busquedaInterpretadaSchema = z.object({
  terminos: z.string().trim().min(1, "Términos requeridos").max(200),
  categoria: z.string().trim().max(120).optional(),
});

export const busquedaIaResponseSchema = busquedaInterpretadaSchema.extend({
  modo: z.enum(["demo", "real"]),
});

export type BusquedaIaRequest = z.infer<typeof busquedaIaRequestSchema>;
export type BusquedaInterpretada = z.infer<typeof busquedaInterpretadaSchema>;
export type BusquedaIaResponse = z.infer<typeof busquedaIaResponseSchema>;
