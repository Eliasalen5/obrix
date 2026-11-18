import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { planService } from "@/lib/services/plan.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  try {
    const data = await planService.listarSuscripciones(id);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
