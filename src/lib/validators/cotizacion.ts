import { z } from "zod";
import { CANTIDAD_MAX } from "./asistente";

export const PROMPT_MAX = 2000;
export const MATERIALES_MAX = 80;

export const RANKING_POR = "cobertura_precio" as const;

export const ESTADOS_COTIZACION = [
  "BORRADOR",
  "ENVIADA",
  "COMPARADA",
] as const;

const cantidadSchema = z
  .number()
  .positive("La cantidad debe ser mayor a 0")
  .max(CANTIDAD_MAX, "La cantidad es demasiado grande");

export const materialInputSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre de material requerido").max(120),
  cantidad: cantidadSchema,
  unidad: z.string().trim().min(1, "Unidad requerida").max(40),
  productoId: z.string().trim().min(1).optional(),
});

export const ubicacionSchema = z.object({
  lat: z.number().min(-90, "Latitud fuera de rango").max(90, "Latitud fuera de rango"),
  lng: z
    .number()
    .min(-180, "Longitud fuera de rango")
    .max(180, "Longitud fuera de rango"),
});

export const crearCotizacionSchema = z.object({
  prompt: z
    .string()
    .trim()
    .max(PROMPT_MAX, `El texto es demasiado largo (máximo ${PROMPT_MAX} caracteres)`)
    .optional(),
  materiales: z
    .array(materialInputSchema)
    .min(1, "Agregá al menos un material")
    .max(MATERIALES_MAX, `Máximo ${MATERIALES_MAX} materiales por cotización`),
  ubicacion: ubicacionSchema.optional(),
});

export const matchSchema = z.object({
  productoId: z.string(),
  sku: z.string(),
  nombre: z.string(),
  score: z.number().min(0).max(1),
  coincideUnidad: z.boolean(),
  unidadProducto: z.string(),
});

export const alternativaSchema = z.object({
  productoId: z.string(),
  sku: z.string(),
  nombre: z.string(),
  score: z.number().min(0).max(1),
});

export const materialCotizadoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  cantidad: z.number(),
  unidad: z.string(),
  productoId: z.string().nullable(),
  match: matchSchema.nullable(),
  alternativas: z.array(alternativaSchema),
});

export const cotizacionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  estado: z.enum(ESTADOS_COTIZACION),
  createdAt: z.string(),
  materiales: z.array(materialCotizadoSchema),
});

export const ofertaComparadaSchema = z.object({
  materialId: z.string(),
  nombre: z.string(),
  cantidad: z.number(),
  unidad: z.string(),
  precioUnitario: z.number(),
  subtotal: z.number(),
  stock: z.number().int(),
});

export const faltanteSchema = z.object({
  materialId: z.string(),
  nombre: z.string(),
});

export const comercioComparadoSchema = z.object({
  comercioId: z.string(),
  nombre: z.string(),
  direccion: z.string(),
  telefono: z.string(),
  distanciaKm: z.number().nullable().default(null),
  itemsCubiertos: z.number().int(),
  itemsTotales: z.number().int(),
  cubreTodo: z.boolean(),
  total: z.number(),
  esTotalCompleto: z.boolean(),
  faltantes: z.array(faltanteSchema),
  detalle: z.array(ofertaComparadaSchema),
});

export const itemComparadoSchema = z.object({
  materialId: z.string(),
  nombre: z.string(),
  mejor: z
    .object({
      comercioId: z.string(),
      nombre: z.string(),
      precioUnitario: z.number(),
    })
    .nullable(),
});

export const sinMatchSchema = z.object({
  materialId: z.string(),
  nombre: z.string(),
  cantidad: z.number(),
  unidad: z.string(),
});

export const comparacionSchema = z.object({
  itemsTotales: z.number().int(),
  rankingPor: z.literal(RANKING_POR),
  comercios: z.array(comercioComparadoSchema),
  items: z.array(itemComparadoSchema),
  sinMatch: z.array(sinMatchSchema),
  advertencias: z.array(z.string()),
});

export const cotizacionResponseSchema = z.object({
  cotizacion: cotizacionSchema,
  comparacion: comparacionSchema,
});

export type MaterialInput = z.infer<typeof materialInputSchema>;
export type CrearCotizacionInput = z.infer<typeof crearCotizacionSchema>;
export type Ubicacion = z.infer<typeof ubicacionSchema>;

export type MatchInfo = z.infer<typeof matchSchema>;
export type Alternativa = z.infer<typeof alternativaSchema>;
export type MaterialCotizado = z.infer<typeof materialCotizadoSchema>;
export type Cotizacion = z.infer<typeof cotizacionSchema>;

export type OfertaComparada = z.infer<typeof ofertaComparadaSchema>;
export type Faltante = z.infer<typeof faltanteSchema>;
export type ComercioComparado = z.infer<typeof comercioComparadoSchema>;
export type ItemComparado = z.infer<typeof itemComparadoSchema>;
export type SinMatch = z.infer<typeof sinMatchSchema>;
export type Comparacion = z.infer<typeof comparacionSchema>;
export type CotizacionResponse = z.infer<typeof cotizacionResponseSchema>;
