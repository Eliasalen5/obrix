import type { NextRequest } from "next/server";
import { jsonError, zodDetails } from "@/lib/api/http";
import { getAiProvider, resolveAiConfig } from "@/lib/ai";
import {
  AiInvalidResponseError,
  AiProviderError,
  AiTimeoutError,
} from "@/lib/ai/errors";
import { visionRateLimiter } from "@/lib/rate-limit";
import { responderConsulta } from "@/lib/services/visionConsulta.service";
import { consultaVisionRequestSchema } from "@/lib/validators/vision";

function ipCliente(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "anon";
}

export async function POST(request: NextRequest) {
  const limit = await visionRateLimiter.check(`ip:${ipCliente(request)}`);
  if (!limit.allowed) {
    if (limit.degraded) {
      return jsonError(
        503,
        "Las consultas por fotografía no están disponibles en este momento. Intentá de nuevo más tarde.",
      );
    }
    return Response.json(
      { error: "Demasiadas solicitudes. Esperá unos segundos e intentá de nuevo." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil(limit.retryAfterMs / 1000))),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Enviá la consulta como JSON");
  }

  const parsed = consultaVisionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Consulta inválida", zodDetails(parsed.error));
  }

  const config = resolveAiConfig();
  try {
    const data = await responderConsulta(parsed.data, getAiProvider(config), {
      timeoutMs: config.timeoutMs,
    });
    return Response.json({ data });
  } catch (error) {
    if (error instanceof AiTimeoutError) {
      return jsonError(
        504,
        "La consulta tardó demasiado en responder. Intentá de nuevo.",
      );
    }
    if (error instanceof AiInvalidResponseError) {
      return jsonError(
        502,
        "La consulta devolvió una respuesta inválida. Intentá de nuevo.",
      );
    }
    if (error instanceof AiProviderError) {
      return jsonError(502, "El proveedor de IA no está disponible en este momento.");
    }
    return jsonError(500, "Error interno del servidor");
  }
}
