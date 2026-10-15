import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { productoService } from "@/lib/services/catalogo.service";

export async function GET() {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await productoService.list();
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
