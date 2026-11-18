import { z } from "zod";
import { PLAN_IDS } from "@/lib/planes";

export const asignarPlanSchema = z.object({
  plan: z.enum(PLAN_IDS),
  motivo: z
    .string()
    .trim()
    .max(300, "Máximo 300 caracteres")
    .optional()
    .or(z.literal("")),
  planVence: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((valor) => (valor ? new Date(valor) : null))
    .refine(
      (fecha) => fecha === null || !Number.isNaN(fecha.getTime()),
      "Fecha inválida",
    ),
});

export type AsignarPlanInput = z.infer<typeof asignarPlanSchema>;
/** Forma previa al parseo (la que envía el cliente: `planVence` como string). */
export type AsignarPlanPayload = z.input<typeof asignarPlanSchema>;
