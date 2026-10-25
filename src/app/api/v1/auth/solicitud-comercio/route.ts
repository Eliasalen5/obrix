import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { solicitudAltaComercioSchema } from "@/lib/validators/auth";
import { registroService, RegistroError } from "@/lib/services/registro.service";
import { registroRateLimiter } from "@/lib/rate-limit";

function getClientKey(h: Headers) {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = h.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

export async function POST(request: NextRequest) {
  const h = await headers();
  const limit = registroRateLimiter.check(`registro-comercio:ip:${getClientKey(h)}`);
  if (!limit.allowed) {
    return Response.json(
      { error: "Demasiados intentos. Intentá de nuevo más tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil(limit.retryAfterMs / 1000))),
        },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = solicitudAltaComercioSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const result = await registroService.solicitarAltaComercio(parsed.data);
    return Response.json(
      {
        data: {
          solicitudId: result.solicitud.id,
          estado: result.solicitud.estado,
          email: result.usuario.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof RegistroError && error.motivo === "EMAIL_EXISTENTE") {
      return jsonError(409, "No fue posible enviar la solicitud con los datos provistos");
    }
    return prismaErrorResponse(error);
  }
}
