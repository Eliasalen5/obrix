import { z } from "zod";

// Estados de una solicitud de producto (String + constantes, sin enums en Prisma)
export const ESTADOS_SOLICITUD = {
  PENDIENTE: "PENDIENTE_REVISION",
  APROBADA: "APROBADA",
  VINCULADA: "VINCULADA",
  RECHAZADA: "RECHAZADA",
} as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[keyof typeof ESTADOS_SOLICITUD];

export const ESTADOS_SOLICITUD_LISTA: readonly string[] = Object.values(
  ESTADOS_SOLICITUD,
);

// Datos propuestos por el comercio para un producto aún inexistente.
// Se guardan como Json en SolicitudProducto.datos hasta la revisión del admin.
export const propuestaProductoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Nombre requerido (mínimo 2 caracteres)")
    .max(120, "Máximo 120 caracteres"),
  categoriaId: z.string().trim().min(1, "Categoría requerida"),
  unidad: z
    .string()
    .trim()
    .min(1, "Presentación / medida requerida")
    .max(40, "Máximo 40 caracteres"),
  marca: z.string().trim().max(80, "Máximo 80 caracteres").default(""),
  fabricante: z.string().trim().max(80, "Máximo 80 caracteres").default(""),
  codigoBarras: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z\- ]*$/, "Código de barras inválido")
    .max(40, "Máximo 40 caracteres")
    .default(""),
  codigoFabricante: z
    .string()
    .trim()
    .max(40, "Máximo 40 caracteres")
    .default(""),
  descripcion: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .default(""),
  imagenUrl: z
    .string()
    .trim()
    .max(300, "Máximo 300 caracteres")
    .default(""),
  atributos: z
    .record(z.string(), z.string())
    .default({}), // peso, volumen, dimensiones, etc.
  // Oferta inicial del comercio que propone (precio/stock son datos comerciales)
  precio: z.number().positive("Precio debe ser mayor a 0"),
  stock: z
    .number()
    .int("Stock debe ser un entero")
    .min(-1, "Stock inválido (-1 = sin control)")
    .default(0),
});

export type PropuestaProductoInput = z.infer<typeof propuestaProductoSchema>;

export const crearSolicitudSchema = z.object({
  propuesta: propuestaProductoSchema,
});

export type CrearSolicitudInput = z.infer<typeof crearSolicitudSchema>;

// Decisión del admin: aprobar como producto nuevo o vincular a uno existente
export const aprobarSolicitudSchema = z.discriminatedUnion("modo", [
  z.object({ modo: z.literal("nuevo") }),
  z.object({
    modo: z.literal("vincular"),
    productoId: z.string().trim().min(1, "Producto existente requerido"),
  }),
]);

export type AprobarSolicitudInput = z.infer<typeof aprobarSolicitudSchema>;

export const rechazarSolicitudSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, "Indicá un motivo de rechazo (mínimo 3 caracteres)")
    .max(300, "Máximo 300 caracteres"),
});

export type RechazarSolicitudInput = z.infer<typeof rechazarSolicitudSchema>;
