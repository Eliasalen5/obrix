import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { obtenerResumenComercio } from "@/lib/services/resumen.service";

export async function GET() {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await obtenerResumenComercio(access.comercioId);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
