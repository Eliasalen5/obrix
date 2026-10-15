import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { getComercioIdByOwner } from "@/lib/services/comercio.service";
import { pedidoService } from "@/lib/services/pedido.service";

const SIN_COMERCIO = "El usuario no tiene un comercio asociado";

export async function GET() {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const comercioId = await getComercioIdByOwner(access.userId);
    if (!comercioId) return jsonError(403, SIN_COMERCIO);

    const data = await pedidoService.listarComercio(comercioId);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
