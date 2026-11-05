import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { pedidoService } from "@/lib/services/pedido.service";

export async function GET() {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await pedidoService.listarComercio(access.comercioId);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
