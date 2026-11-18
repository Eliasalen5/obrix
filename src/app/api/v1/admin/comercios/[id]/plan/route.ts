import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { asignarPlanSchema } from "@/lib/validators/plan";
import { PlanError, planService } from "@/lib/services/plan.service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);
  if (!access.userId) return jsonError(401, "No autenticado");

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = asignarPlanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const data = await planService.asignarPlan(id, parsed.data, access.userId);
    return Response.json({ data });
  } catch (error) {
    if (error instanceof PlanError) {
      return jsonError(error.status, error.message);
    }
    return prismaErrorResponse(error);
  }
}
