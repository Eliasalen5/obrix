import type { NextRequest } from "next/server";
import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { updateOfertaSchema } from "@/lib/validators/oferta";
import { getComercioIdByOwner } from "@/lib/services/comercio.service";
import { ofertaService } from "@/lib/services/oferta.service";

type Context = { params: Promise<{ id: string }> };

const SIN_COMERCIO = "El usuario no tiene un comercio asociado";

export async function GET(_request: NextRequest, { params }: Context) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  try {
    const comercioId = await getComercioIdByOwner(access.userId);
    if (!comercioId) return jsonError(403, SIN_COMERCIO);

    const data = await ofertaService.getForComercio(comercioId, id);
    if (!data) return jsonError(404, "Recurso no encontrado");
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateOfertaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }
  if (Object.keys(parsed.data).length === 0) {
    return jsonError(400, "Nada para actualizar");
  }

  try {
    const comercioId = await getComercioIdByOwner(access.userId);
    if (!comercioId) return jsonError(403, SIN_COMERCIO);

    const result = await ofertaService.updateForComercio(
      comercioId,
      id,
      parsed.data,
    );
    if (result.count === 0) return jsonError(404, "Recurso no encontrado");

    const data = await ofertaService.getForComercio(comercioId, id);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  try {
    const comercioId = await getComercioIdByOwner(access.userId);
    if (!comercioId) return jsonError(403, SIN_COMERCIO);

    const result = await ofertaService.removeForComercio(comercioId, id);
    if (result.count === 0) return jsonError(404, "Recurso no encontrado");
    return new Response(null, { status: 204 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
