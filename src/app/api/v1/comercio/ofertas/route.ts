import type { NextRequest } from "next/server";
import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { createOfertaSchema } from "@/lib/validators/oferta";
import { ofertaService } from "@/lib/services/oferta.service";

export async function GET() {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await ofertaService.listByComercio(access.comercioId);
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
    const data = await ofertaService.upsertForComercio(
      access.comercioId,
      parsed.data,
    );
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
