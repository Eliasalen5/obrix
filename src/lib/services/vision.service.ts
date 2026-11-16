import type { AiProvider } from "@/lib/ai/types";
import { AiInvalidResponseError, AiTimeoutError } from "@/lib/ai/errors";
import { CATEGORIAS } from "@/lib/catalogo/categorias";
import {
  buscarOfertasPublicas,
  type OfertaPublica,
} from "@/lib/ofertas/buscarOfertas";
import { normalizarClave } from "@/lib/text/busqueda";
import {
  identificacionVisualSchema,
  type VisionResponse,
} from "@/lib/validators/vision";

function mapearOferta(oferta: OfertaPublica) {
  return {
    id: oferta.id,
    productoNombre: oferta.producto.nombre,
    marca: oferta.marca || oferta.producto.marca,
    presentacion: oferta.presentacion,
    unidad: oferta.producto.unidad,
    precio: oferta.precio,
    categoria: oferta.producto.categoria.nombre,
    comercioNombre: oferta.comercio.nombre,
    comercioDireccion: oferta.comercio.direccion,
  };
}

export async function identificarYBuscar(
  imagenBase64: string,
  mime: string,
  provider: AiProvider,
  opts: { timeoutMs: number; detalle?: string },
): Promise<VisionResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  let raw: unknown;
  try {
    raw = await provider.identificarImagen(
      imagenBase64,
      mime,
      controller.signal,
      { detalle: opts.detalle },
    );
  } catch (error) {
    if (controller.signal.aborted) throw new AiTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const parsed = identificacionVisualSchema.safeParse(raw);
  if (!parsed.success) throw new AiInvalidResponseError();

  // La IA solo propone una categoría; nunca se usa un nombre fuera del catálogo.
  const categoria = CATEGORIAS.find(
    (item) =>
      normalizarClave(item.nombre) ===
      normalizarClave(parsed.data.categoria ?? ""),
  )?.nombre;
  const identificacion = { ...parsed.data, categoria };

  const ofertas = await buscarOfertasPublicas({
    q: identificacion.terminos,
    categoria,
    take: 12,
  });

  return {
    identificacion,
    modo: provider.esDemo ? "demo" : "real",
    ofertas: ofertas.map(mapearOferta),
    detalle: opts.detalle?.trim() || undefined,
  };
}
