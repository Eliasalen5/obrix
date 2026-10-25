import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { rechazarSolicitudAltaSchema } from "@/lib/validators/auth";
import { registroService } from "@/lib/services/registro.service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);
  if (!access.userId) return jsonError(401, "No autenticado");

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = rechazarSolicitudAltaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const result = await registroService.rechazarSolicitudAlta(id, access.userId, parsed.data.motivo);
    if (!result.ok) {
      if (result.motivo === "NO_ENCONTRADO") return jsonError(404, "Recurso no encontrado");
      return jsonError(409, "La solicitud ya fue resuelta");
    }
    return Response.json({ data: result.solicitud });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
