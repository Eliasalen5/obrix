import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { planService } from "@/lib/services/plan.service";

export async function GET() {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await planService.listarComercios();
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
