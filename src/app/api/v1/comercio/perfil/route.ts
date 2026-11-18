import type { NextRequest } from "next/server";
import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { updatePerfilComercioSchema } from "@/lib/validators/comercio";
import {
  getPerfilComercio,
  updatePerfilComercio,
} from "@/lib/services/comercio.service";

export async function GET() {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await getPerfilComercio(access.comercioId);
    if (!data) return jsonError(404, "Comercio no encontrado");
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const body = await request.json().catch(() => null);
  const parsed = updatePerfilComercioSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const data = await updatePerfilComercio(access.comercioId, parsed.data);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
