import type { AiProvider } from "@/lib/ai/types";
import { AiInvalidResponseError, AiTimeoutError } from "@/lib/ai/errors";
import {
  proyectoEstimadoSchema,
  type AsistenteResponse,
} from "@/lib/validators/asistente";

const AVISO_ESTIMACION =
  "Las cantidades son estimaciones orientativas y no reemplazan un cálculo profesional.";
const AVISO_DEMO =
  "Respuesta simulada (modo demo): no se consultó un proveedor de IA real.";

export async function generarProyecto(
  descripcion: string,
  provider: AiProvider,
  opts: { timeoutMs: number },
): Promise<AsistenteResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  let raw: unknown;
  try {
    raw = await provider.generarProyecto(descripcion, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new AiTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const parsed = proyectoEstimadoSchema.safeParse(raw);
  if (!parsed.success) throw new AiInvalidResponseError();

  const aclaraciones = [...parsed.data.aclaraciones];
  if (!aclaraciones.includes(AVISO_ESTIMACION) && aclaraciones.length < 30) {
    aclaraciones.push(AVISO_ESTIMACION);
  }

  return {
    titulo: parsed.data.titulo,
    materiales: parsed.data.materiales,
    supuestos: parsed.data.supuestos,
    aclaraciones,
    esEstimacion: true,
    modo: provider.esDemo ? "demo" : "real",
    aviso: provider.esDemo ? AVISO_DEMO : AVISO_ESTIMACION,
  };
}
