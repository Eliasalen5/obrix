import type { NextRequest } from "next/server";
import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse, zodDetails } from "@/lib/api/http";
import { productoService } from "@/lib/services/catalogo.service";
import { listProductosQuerySchema } from "@/lib/validators/catalogo";

/**
 * Catálogo maestro para el comercio.
 * Filtra y pagina en la base: `q` busca en el texto normalizado y
 * `categoriaId` limita a una categoría.
 */
export async function GET(request: NextRequest) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  const { searchParams } = new URL(request.url);
  const parsed = listProductosQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    categoriaId: searchParams.get("categoriaId") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) {
    return jsonError(400, "Datos inválidos", zodDetails(parsed.error));
  }

  try {
    const { productos, total } = await productoService.search(parsed.data);
    return Response.json({
      data: {
        productos,
        total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      },
    });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
