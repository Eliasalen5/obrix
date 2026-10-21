import type { NextRequest } from "next/server";
import { requireClienteApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { crearCotizacionSchema } from "@/lib/validators/cotizacion";
import { cotizacionService } from "@/lib/services/cotizacion.service";

export async function GET() {
  const access = await requireClienteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await cotizacionService.listar(access.userId);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const access = await requireClienteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const body = await request.json().catch(() => null);
  const parsed = crearCotizacionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const data = await cotizacionService.crear(access.userId, parsed.data);
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
