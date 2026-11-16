import { AiInvalidResponseError, AiTimeoutError } from "@/lib/ai/errors";
import type { AiProvider, ContextoConsultaImagen } from "@/lib/ai/types";
import { CATEGORIAS } from "@/lib/catalogo/categorias";
import { normalizarClave } from "@/lib/text/busqueda";
import {
  interpretacionConsultaSchema,
  type ConsultaVisionRequest,
  type ConsultaVisionResponse,
} from "@/lib/validators/vision";
import { buscarCoincidencias } from "./vision.service";

function categoriaValida(categoria: string | undefined): string | undefined {
  return CATEGORIAS.find(
    (item) => normalizarClave(item.nombre) === normalizarClave(categoria ?? ""),
  )?.nombre;
}

/**
 * Responde una pregunta de seguimiento sobre la foto. La IA SOLO interpreta la
 * intención y genera términos; los productos y la respuesta se construyen con
 * resultados reales del catálogo (nunca se inventan productos, marcas o stock).
 */
export async function responderConsulta(
  request: ConsultaVisionRequest,
  provider: AiProvider,
  opts: { timeoutMs: number },
): Promise<ConsultaVisionResponse> {
  const { identificacion, detalle } = request.contexto;

  const contexto: ContextoConsultaImagen = {
    objeto: identificacion.objeto,
    tipo: identificacion.tipo,
    caracteristicas: identificacion.caracteristicas,
    terminos: identificacion.terminos,
    categoria: categoriaValida(identificacion.categoria),
    detalle,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  let raw: unknown;
  try {
    raw = await provider.responderConsultaImagen(
      request.pregunta,
      contexto,
      controller.signal,
    );
  } catch (error) {
    if (controller.signal.aborted) throw new AiTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const parsed = interpretacionConsultaSchema.safeParse(raw);
  if (!parsed.success) throw new AiInvalidResponseError();

  const categoria = categoriaValida(parsed.data.categoria) ?? contexto.categoria;

  // Reutiliza la búsqueda por coincidencias con los términos de la consulta y
  // las características del objeto original.
  const ofertas = await buscarCoincidencias(
    {
      ...identificacion,
      terminos: parsed.data.terminos,
      categoria,
      caracteristicas: identificacion.caracteristicas,
    },
    categoria,
  );

  const respuesta =
    ofertas.length > 0
      ? `${parsed.data.interpretacion} Encontré ${ofertas.length} ${
          ofertas.length === 1 ? "producto" : "productos"
        } del catálogo que pueden servirte.`
      : `${parsed.data.interpretacion} No encontré productos que coincidan en el catálogo. Probá con otra descripción o consultá al comercio.`;

  return {
    respuesta,
    modo: provider.esDemo ? "demo" : "real",
    ofertas,
  };
}
