import type { NextRequest } from "next/server";
import { jsonError, zodDetails } from "@/lib/api/http";
import { busquedaIaRequestSchema } from "@/lib/validators/busqueda";
import { busquedaIaRateLimiter } from "@/lib/rate-limit";
import { getAiProvider, resolveAiConfig } from "@/lib/ai";
import {
  AiInvalidResponseError,
  AiProviderError,
  AiTimeoutError,
} from "@/lib/ai/errors";
import { interpretarBusqueda } from "@/lib/services/busquedaIa.service";

function ipCliente(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "anon";
}

export async function POST(request: NextRequest) {
  const limit = await busquedaIaRateLimiter.check(`ip:${ipCliente(request)}`);
  if (!limit.allowed) {
    if (limit.degraded) {
      return jsonError(
        503,
        "El buscador inteligente no está disponible en este momento. Intentá de nuevo más tarde.",
      );
    }
    return Response.json(
      { error: "Demasiadas búsquedas. Esperá unos segundos e intentá de nuevo." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil(limit.retryAfterMs / 1000))),
        },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = busquedaIaRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  const config = resolveAiConfig();
  try {
    const data = await interpretarBusqueda(
      parsed.data.consulta,
      getAiProvider(config),
      { timeoutMs: config.timeoutMs },
    );
    return Response.json({ data });
  } catch (error) {
    if (error instanceof AiTimeoutError) {
      return jsonError(
        504,
        "La búsqueda tardó demasiado en responder. Intentá de nuevo.",
      );
    }
    if (error instanceof AiInvalidResponseError) {
      return jsonError(
        502,
        "El buscador devolvió una respuesta inválida. Intentá de nuevo.",
      );
    }
    if (error instanceof AiProviderError) {
      return jsonError(502, "El proveedor de IA no está disponible en este momento.");
    }
    return jsonError(500, "Error interno del servidor");
  }
}
