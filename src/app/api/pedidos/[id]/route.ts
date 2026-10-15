import type { NextRequest } from "next/server";
import { requireClienteApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { cancelarPedidoSchema } from "@/lib/validators/pedido";
import { pedidoService } from "@/lib/services/pedido.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const access = await requireClienteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  try {
    const data = await pedidoService.obtenerCliente(access.userId, id);
    if (!data) return jsonError(404, "Recurso no encontrado");
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await requireClienteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = cancelarPedidoSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const result = await pedidoService.cancelarCliente(access.userId, id);
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
