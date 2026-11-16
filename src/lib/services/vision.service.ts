import type { AiProvider } from "@/lib/ai/types";
import { AiInvalidResponseError, AiTimeoutError } from "@/lib/ai/errors";
import { CATEGORIAS } from "@/lib/catalogo/categorias";
import {
  buscarOfertasPublicas,
  type OfertaPublica,
} from "@/lib/ofertas/buscarOfertas";
import { normalizarClave } from "@/lib/text/busqueda";
import {
  clavesDeIdentificacion,
  clasificarOferta,
  type Clasificacion,
} from "@/lib/vision/coincidencias";
import {
  identificacionVisualSchema,
  type OfertaCompatible,
  type VisionResponse,
} from "@/lib/validators/vision";

const PESO_NIVEL = { alta: 0, probable: 1, similar: 2 } as const;
const TAKE_PRINCIPALES = 24;
const TAKE_AMPLIACION = 24;
const MAX_RESULTADOS = 12;

function mapearOferta(
  oferta: OfertaPublica,
  clasificacion: Clasificacion,
): OfertaCompatible {
  return {
    id: oferta.id,
    productoNombre: oferta.producto.nombre,
    descripcion: oferta.producto.descripcion,
    marca: oferta.marca || oferta.producto.marca,
    presentacion: oferta.presentacion,
    unidad: oferta.producto.unidad,
    precio: oferta.precio,
    stock: oferta.stock,
    categoria: oferta.producto.categoria.nombre,
    comercioNombre: oferta.comercio.nombre,
    comercioDireccion: oferta.comercio.direccion,
    localidad: [oferta.comercio.localidad, oferta.comercio.provincia]
      .filter(Boolean)
      .join(", "),
    nivel: clasificacion.nivel,
    caracteristicasCoincidentes: clasificacion.caracteristicasCoincidentes,
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

  const ofertas = await buscarCoincidencias(identificacion, categoria);

  return {
    identificacion,
    modo: provider.esDemo ? "demo" : "real",
    ofertas,
    detalle: opts.detalle?.trim() || undefined,
  };
}

/**
 * Busca ofertas del catálogo para la identificación. La búsqueda principal usa
 * los términos (AND estricto); la ampliación por categoría aporta coincidencias
 * probables y alternativas similares. Los productos siempre salen de la DB.
 */
export async function buscarCoincidencias(
  identificacion: VisionResponse["identificacion"],
  categoria: string | undefined,
): Promise<OfertaCompatible[]> {
  const claves = clavesDeIdentificacion(identificacion);

  const principales = await buscarOfertasPublicas({
    q: identificacion.terminos,
    categoria,
    take: TAKE_PRINCIPALES,
  });

  // Sin categoría no hay forma razonable de ampliar sin traer ruido: devolvemos
  // solo las coincidencias directas (todas contendrán los términos).
  const ampliacion = categoria
    ? await buscarOfertasPublicas({ categoria, take: TAKE_AMPLIACION })
    : [];

  const vistas = new Set<string>();
  const mapeadas: OfertaCompatible[] = [];

  for (const oferta of [...principales, ...ampliacion]) {
    if (vistas.has(oferta.id)) continue;
    vistas.add(oferta.id);
    mapeadas.push(
      mapearOferta(
        oferta,
        clasificarOferta(oferta, claves, identificacion.caracteristicas),
      ),
    );
  }

  return mapeadas
    .sort((a, b) => PESO_NIVEL[a.nivel] - PESO_NIVEL[b.nivel])
    .slice(0, MAX_RESULTADOS);
}
