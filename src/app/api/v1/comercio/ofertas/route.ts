import type { NextRequest } from "next/server";
import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { createOfertaSchema } from "@/lib/validators/oferta";
import { getComercioIdByOwner } from "@/lib/services/comercio.service";
import { ofertaService } from "@/lib/services/oferta.service";

const SIN_COMERCIO = "El usuario no tiene un comercio asociado";

export async function GET() {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const comercioId = await getComercioIdByOwner(access.userId);
    if (!comercioId) return jsonError(403, SIN_COMERCIO);

    const data = await ofertaService.listByComercio(comercioId);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const body = await request.json().catch(() => null);
  const parsed = createOfertaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const comercioId = await getComercioIdByOwner(access.userId);
    if (!comercioId) return jsonError(403, SIN_COMERCIO);

    const data = await ofertaService.upsertForComercio(comercioId, parsed.data);
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
