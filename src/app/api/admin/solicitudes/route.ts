import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { solicitudService } from "@/lib/services/solicitud.service";
import { ESTADOS_SOLICITUD_LISTA } from "@/lib/validators/solicitud";

/** Solicitudes de producto para revisión administrativa (?estado= opcional). */
export async function GET(request: NextRequest) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado")?.trim() ?? "";
  if (estado && !ESTADOS_SOLICITUD_LISTA.includes(estado)) {
    return jsonError(400, "Estado inválido");
  }

  try {
    const data = await solicitudService.listarAdmin(estado || undefined);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
