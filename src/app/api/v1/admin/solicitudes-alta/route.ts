import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { registroService } from "@/lib/services/registro.service";

export async function GET(request: NextRequest) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado")?.trim() || undefined;

  try {
    const data = await registroService.listarSolicitudesAlta(estado);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
