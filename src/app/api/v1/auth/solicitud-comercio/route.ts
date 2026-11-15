import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import {
  actualizacionSolicitudAltaComercioSchema,
  solicitudAltaComercioSchema,
} from "@/lib/validators/auth";
import { requireClienteApi } from "@/lib/auth/apiAuth";
import { registroService, RegistroError } from "@/lib/services/registro.service";
import { registroRateLimiter } from "@/lib/rate-limit";

function getClientKey(h: Headers) {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = h.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

export async function POST(request: NextRequest) {
  const h = await headers();
  const limit = await registroRateLimiter.check(`registro-comercio:ip:${getClientKey(h)}`);
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

export async function PUT(request: NextRequest) {
  const access = await requireClienteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const body = await request.json().catch(() => null);
  const parsed = actualizacionSolicitudAltaComercioSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const result = await registroService.actualizarSolicitudRechazada(
      access.userId,
      parsed.data,
    );
    if (!result.ok) {
      if (result.motivo === "NO_ENCONTRADO") {
        return jsonError(404, "No tenés una solicitud de alta enviada");
      }
      return jsonError(409, "Solo podés actualizar una solicitud rechazada");
    }
    return Response.json({ data: result.solicitud });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
