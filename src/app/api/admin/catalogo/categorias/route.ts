import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { createCategoriaSchema } from "@/lib/validators/catalogo";
import { categoriaService } from "@/lib/services/catalogo.service";

export async function GET() {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await categoriaService.list();
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const body = await request.json().catch(() => null);
  const parsed = createCategoriaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const data = await categoriaService.create(parsed.data);
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
