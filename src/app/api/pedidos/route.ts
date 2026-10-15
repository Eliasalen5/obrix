import type { NextRequest } from "next/server";
import { requireClienteApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { crearPedidoSchema } from "@/lib/validators/pedido";
import { pedidoService } from "@/lib/services/pedido.service";

export async function GET() {
  const access = await requireClienteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const data = await pedidoService.listarCliente(access.userId);
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const access = await requireClienteApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const body = await request.json().catch(() => null);
  const parsed = crearPedidoSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const result = await pedidoService.crear(access.userId, parsed.data);
    if (!result.ok) {
      switch (result.motivo) {
        case "NO_COTIZACION":
          return jsonError(404, "Cotización no encontrada");
        case "NO_COMERCIO":
          return jsonError(400, "El comercio no existe o está inactivo");
        case "SIN_ITEMS":
          return jsonError(
            400,
            "El comercio no cubre ninguno de los materiales de la cotización",
          );
      }
    }
    return Response.json({ data: result.pedido }, { status: 201 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
