import type { NextRequest } from "next/server";
import { requireAsistenteApi } from "@/lib/auth/apiAuth";
import { jsonError, zodDetails } from "@/lib/api/http";
import { asistenteRequestSchema } from "@/lib/validators/asistente";
import { asistenteRateLimiter } from "@/lib/rate-limit";
import { getAiProvider, resolveAiConfig } from "@/lib/ai";
import {
  AiInvalidResponseError,
  AiProviderError,
  AiTimeoutError,
} from "@/lib/ai/errors";
import { generarProyecto } from "@/lib/services/asistente.service";

export async function POST(request: NextRequest) {
  const access = await requireAsistenteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const limit = asistenteRateLimiter.check(`user:${access.userId}`);
  if (!limit.allowed) {
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

  const body = await request.json().catch(() => null);
  const parsed = asistenteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  const config = resolveAiConfig();
  try {
    const data = await generarProyecto(
      parsed.data.descripcion,
      getAiProvider(config),
      { timeoutMs: config.timeoutMs },
    );
    return Response.json({ data });
  } catch (error) {
    if (error instanceof AiTimeoutError) {
      return jsonError(
        504,
        "El asistente tardó demasiado en responder. Intentá de nuevo.",
      );
    }
    if (error instanceof AiInvalidResponseError) {
      return jsonError(
        502,
        "El asistente devolvió una respuesta inválida. Intentá de nuevo.",
      );
    }
    if (error instanceof AiProviderError) {
      return jsonError(502, "El proveedor de IA no está disponible en este momento.");
    }
    return jsonError(500, "Error interno del servidor");
  }
}
