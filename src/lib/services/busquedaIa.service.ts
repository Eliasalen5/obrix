import type { AiProvider } from "@/lib/ai/types";
import { AiInvalidResponseError, AiTimeoutError } from "@/lib/ai/errors";
import {
  busquedaInterpretadaSchema,
  type BusquedaIaResponse,
} from "@/lib/validators/busqueda";

export async function interpretarBusqueda(
  consulta: string,
  provider: AiProvider,
  opts: { timeoutMs: number },
): Promise<BusquedaIaResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  let raw: unknown;
  try {
    raw = await provider.interpretarBusqueda(consulta, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new AiTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const parsed = busquedaInterpretadaSchema.safeParse(raw);
  if (!parsed.success) throw new AiInvalidResponseError();

  return {
    terminos: parsed.data.terminos,
    categoria: parsed.data.categoria,
    modo: provider.esDemo ? "demo" : "real",
  };
}
