import type { NextRequest } from "next/server";
import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { actualizarEstadoPedidoSchema } from "@/lib/validators/pedido";
import { pedidoService } from "@/lib/services/pedido.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  try {
    const data = await pedidoService.obtenerComercio(access.comercioId, id);
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
  const parsed = actualizarEstadoPedidoSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const result = await pedidoService.cambiarEstadoComercio(
      access.comercioId,
      id,
      parsed.data.estado,
    );
    if (!result.ok) {
      return result.motivo === "NO_ENCONTRADO"
        ? jsonError(404, "Recurso no encontrado")
        : jsonError(409, "Transición de estado no permitida");
    }
    return Response.json({ data: result.pedido });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
