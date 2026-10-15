import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { updateCategoriaSchema } from "@/lib/validators/catalogo";
import { categoriaService } from "@/lib/services/catalogo.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  try {
    const data = await categoriaService.get(id);
    if (!data) return jsonError(404, "Recurso no encontrado");
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateCategoriaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const data = await categoriaService.update(id, parsed.data);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  try {
    await categoriaService.remove(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
