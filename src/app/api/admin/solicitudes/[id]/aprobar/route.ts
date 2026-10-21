import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { SolicitudError, solicitudService } from "@/lib/services/solicitud.service";
import { aprobarSolicitudSchema } from "@/lib/validators/solicitud";

type Context = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  if (error instanceof SolicitudError) {
    return jsonError(error.status, error.message, error.details);
  }
  return prismaErrorResponse(error);
}

/**
 * Aprueba una solicitud: { modo: "nuevo" } crea el producto maestro + oferta,
 * { modo: "vincular", productoId } reutiliza un producto existente y crea la
 * oferta. Todo dentro de una transacción.
 */
export async function POST(request: NextRequest, { params }: Context) {
  const access = await requireAdminApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = aprobarSolicitudSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const data = await solicitudService.aprobar(id, parsed.data, access.userId);
    return Response.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
