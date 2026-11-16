import type { NextRequest } from "next/server";
import { jsonError, zodDetails } from "@/lib/api/http";
import { getAiProvider, resolveAiConfig } from "@/lib/ai";
import {
  AiInvalidResponseError,
  AiProviderError,
  AiTimeoutError,
} from "@/lib/ai/errors";
import { visionRateLimiter } from "@/lib/rate-limit";
import { identificarYBuscar } from "@/lib/services/vision.service";
import {
  imagenVisionSchema,
  tieneFirmaImagenValida,
} from "@/lib/validators/vision";

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
        "La identificación por fotografía no está disponible en este momento. Intentá de nuevo más tarde.",
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

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError(400, "Enviá la fotografía como formulario");

  const parsed = imagenVisionSchema.safeParse({
    imagen: form.get("imagen"),
    detalle: form.get("detalle"),
  });
  if (!parsed.success) {
    return jsonError(400, "Fotografía inválida", zodDetails(parsed.error));
  }

  const imagen = parsed.data.imagen;
  const detalle = parsed.data.detalle;
  const bytes = new Uint8Array(await imagen.arrayBuffer());
  if (!tieneFirmaImagenValida(bytes, imagen.type)) {
    return jsonError(400, "El archivo no contiene una imagen válida");
  }

  const config = resolveAiConfig();
  try {
    // Se procesa en memoria y no se persiste la foto ni su contenido en base64.
    const data = await identificarYBuscar(
      Buffer.from(bytes).toString("base64"),
      imagen.type,
      getAiProvider(config),
      { timeoutMs: config.timeoutMs, detalle },
    );
    return Response.json({ data });
  } catch (error) {
    if (error instanceof AiTimeoutError) {
      return jsonError(
        504,
        "La identificación tardó demasiado en responder. Intentá de nuevo.",
      );
    }
    if (error instanceof AiInvalidResponseError) {
      return jsonError(
        502,
        "La identificación devolvió una respuesta inválida. Intentá de nuevo.",
      );
    }
    if (error instanceof AiProviderError) {
      return jsonError(502, "El proveedor de IA no está disponible en este momento.");
    }
    return jsonError(500, "Error interno del servidor");
  }
}
