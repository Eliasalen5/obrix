import { z } from "zod";

function coordenada(min: number, max: number, mensaje: string) {
  return z.coerce.number().finite(mensaje).min(min).max(max);
}

export const updatePerfilComercioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Nombre requerido (mínimo 2 caracteres)")
    .max(120, "Máximo 120 caracteres"),
  telefono: z
    .string()
    .trim()
    .max(40, "Máximo 40 caracteres")
    .optional()
    .or(z.literal("")),
  direccion: z
    .string()
    .trim()
    .min(5, "Dirección requerida (mínimo 5 caracteres)")
    .max(200, "Máximo 200 caracteres"),
  localidad: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .or(z.literal("")),
  provincia: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .or(z.literal("")),
  lat: coordenada(-90, 90, "Latitud inválida"),
  lng: coordenada(-180, 180, "Longitud inválida"),
});

export type UpdatePerfilComercioInput = z.infer<
  typeof updatePerfilComercioSchema
>;
