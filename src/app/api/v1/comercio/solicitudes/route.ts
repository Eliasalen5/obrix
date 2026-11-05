import type { NextRequest } from "next/server";
import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { SolicitudError, solicitudService } from "@/lib/services/solicitud.service";
import {
  crearSolicitudSchema,
  ESTADOS_SOLICITUD_LISTA,
} from "@/lib/validators/solicitud";

function errorResponse(error: unknown) {
  if (error instanceof SolicitudError) {
    return jsonError(error.status, error.message, error.details);
  }
  return prismaErrorResponse(error);
}

/** Solicitudes de producto del comercio autenticado (?estado= opcional). */
export async function GET(request: NextRequest) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado")?.trim() ?? "";
  if (estado && !ESTADOS_SOLICITUD_LISTA.includes(estado)) {
    return jsonError(400, "Estado inválido");
  }

  try {
    const data = await solicitudService.listarPorComercio(
      access.comercioId,
      estado || undefined,
    );
    return Response.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Propone un producto que no existe en el catálogo maestro.
 * Si hay coincidencia confiable (código de barras/fabricante o nombre
 * normalizado) responde 409 con { coincidencias } para reutilizar el existente.
 */
export async function POST(request: NextRequest) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const body = await request.json().catch(() => null);
  const parsed = crearSolicitudSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const { solicitud, posiblesDuplicados } = await solicitudService.crear(
      access.comercioId,
      parsed.data.propuesta,
    );
    return Response.json(
      { data: { solicitud, posiblesDuplicados } },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
