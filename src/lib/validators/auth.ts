import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().trim().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
    nombre: z.string().trim().min(2, "Nombre requerido (mínimo 2 caracteres)"),
    telefono: z
      .string()
      .trim()
      .min(6, "Teléfono requerido")
      .max(40, "Máximo 40 caracteres")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

const coordenadaSchema = z.coerce
  .number()
  .finite("Coordenada inválida")
  .refine((v) => v >= -90 && v <= 90, "Latitud inválida")
  .or(
    z.coerce
      .number()
      .finite("Coordenada inválida")
      .refine((v) => v >= -180 && v <= 180, "Longitud inválida"),
  );

export const registroClienteSchema = z
  .object({
    email: z.string().trim().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
    nombre: z.string().trim().min(2, "Nombre requerido (mínimo 2 caracteres)"),
    telefono: z
      .string()
      .trim()
      .min(6, "Teléfono inválido")
      .max(40, "Máximo 40 caracteres")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const solicitudAltaComercioSchema = z
  .object({
    // Datos del titular
    email: z.string().trim().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
    nombreTitular: z
      .string()
      .trim()
      .min(2, "Nombre del titular requerido (mínimo 2 caracteres)"),
    telefonoTitular: z
      .string()
      .trim()
      .min(6, "Teléfono del titular requerido")
      .max(40, "Máximo 40 caracteres"),

    // Datos del comercio
    nombreFantasia: z
      .string()
      .trim()
      .min(2, "Nombre de fantasía requerido (mínimo 2 caracteres)")
      .max(120, "Máximo 120 caracteres"),
    razonSocial: z.string().trim().max(160, "Máximo 160 caracteres").optional().or(z.literal("")),
    cuit: z
      .string()
      .trim()
      .regex(/^(\d{2}-\d{8}-\d{1}|\d{11})$/, "CUIT inválido (formato 00-00000000-0 o 00000000000)")
      .optional()
      .or(z.literal("")),
    direccion: z.string().trim().min(5, "Dirección requerida"),
    provincia: z.string().trim().max(80, "Máximo 80 caracteres").optional().or(z.literal("")),
    localidad: z.string().trim().max(80, "Máximo 80 caracteres").optional().or(z.literal("")),
    lat: z.coerce.number().finite("Latitud inválida").min(-90).max(90),
    lng: z.coerce.number().finite("Longitud inválida").min(-180).max(180),
    telefonoComercial: z
      .string()
      .trim()
      .min(6, "Teléfono comercial requerido")
      .max(40, "Máximo 40 caracteres"),
    rubro: z.string().trim().max(80, "Máximo 80 caracteres").optional().or(z.literal("")),
    categorias: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const rechazarSolicitudAltaSchema = z.object({
  motivo: z.string().trim().min(5, "Motivo requerido (mínimo 5 caracteres)").max(500),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroClienteInput = z.infer<typeof registroClienteSchema>;
export type SolicitudAltaComercioInput = z.infer<typeof solicitudAltaComercioSchema>;
export type RechazarSolicitudAltaInput = z.infer<typeof rechazarSolicitudAltaSchema>;
