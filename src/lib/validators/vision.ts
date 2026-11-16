import { z } from "zod";

export const IMAGEN_MAX_BYTES = 4 * 1024 * 1024;
export const DETALLE_MIN = 10;
export const DETALLE_MAX = 500;
export const TIPOS_IMAGEN_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const imagenVisionSchema = z.object({
  imagen: z
    .instanceof(File, { message: "Subí una fotografía" })
    .refine((file) => file.size > 0, "La fotografía está vacía")
    .refine(
      (file) => file.size <= IMAGEN_MAX_BYTES,
      "La fotografía supera el máximo de 4 MB",
    )
    .refine(
      (file) =>
        TIPOS_IMAGEN_PERMITIDOS.includes(
          file.type as (typeof TIPOS_IMAGEN_PERMITIDOS)[number],
        ),
      "Formato no admitido. Usá JPG, PNG o WebP",
    ),
  detalle: z
    .string({ message: "Contá qué querés hacer con lo que muestra la foto" })
    .trim()
    .min(
      DETALLE_MIN,
      `Contá qué querés hacer (mínimo ${DETALLE_MIN} caracteres)`,
    )
    .max(
      DETALLE_MAX,
      `La descripción es demasiado larga (máximo ${DETALLE_MAX} caracteres)`,
    ),
});

export const identificacionVisualSchema = z.object({
  objeto: z.string().trim().min(1).max(120),
  tipo: z.string().trim().min(1).max(160),
  caracteristicas: z.array(z.string().trim().min(1).max(200)).max(12),
  incertidumbres: z.array(z.string().trim().min(1).max(200)).max(12),
  confianza: z.enum(["probable", "confirmada"]),
  terminos: z.string().trim().min(1).max(200),
  categoria: z.string().trim().max(120).optional(),
});

export type IdentificacionVisual = z.infer<typeof identificacionVisualSchema>;

export const ofertaCompatibleSchema = z.object({
  id: z.string().min(1),
  productoNombre: z.string().min(1),
  marca: z.string(),
  presentacion: z.string(),
  unidad: z.string(),
  precio: z.number().finite().nonnegative(),
  categoria: z.string().min(1),
  comercioNombre: z.string().min(1),
  comercioDireccion: z.string(),
});

export const visionResponseSchema = z.object({
  identificacion: identificacionVisualSchema,
  modo: z.enum(["demo", "real"]),
  ofertas: z.array(ofertaCompatibleSchema).max(12),
  detalle: z.string().trim().max(DETALLE_MAX).optional(),
});

export type OfertaCompatible = z.infer<typeof ofertaCompatibleSchema>;
export type VisionResponse = z.infer<typeof visionResponseSchema>;

/** Firma mínima del contenido; no confiamos solo en el MIME del navegador. */
export function tieneFirmaImagenValida(
  bytes: Uint8Array,
  mime: string,
): boolean {
  if (mime === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }
  if (mime === "image/png") {
    return (
      bytes.length >= 4 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (mime === "image/webp") {
    const texto = (inicio: number, largo: number) =>
      String.fromCharCode(...bytes.slice(inicio, inicio + largo));
    return (
      bytes.length >= 12 && texto(0, 4) === "RIFF" && texto(8, 4) === "WEBP"
    );
  }
  return false;
}
