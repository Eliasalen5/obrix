import type { NextRequest } from "next/server";
import { requireClienteApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { cotizacionService } from "@/lib/services/cotizacion.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const access = await requireClienteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  try {
    const data = await cotizacionService.obtener(access.userId, id);
    if (!data) return jsonError(404, "Recurso no encontrado");
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
