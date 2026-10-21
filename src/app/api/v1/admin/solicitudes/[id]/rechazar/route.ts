import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { SolicitudError, solicitudService } from "@/lib/services/solicitud.service";
import { rechazarSolicitudSchema } from "@/lib/validators/solicitud";

type Context = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  if (error instanceof SolicitudError) {
    return jsonError(error.status, error.message, error.details);
  }
  return prismaErrorResponse(error);
}

/** Rechaza una solicitud conservando el motivo. */
export async function POST(request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = rechazarSolicitudSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const data = await solicitudService.rechazar(id, parsed.data.motivo, access.userId);
    return Response.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
