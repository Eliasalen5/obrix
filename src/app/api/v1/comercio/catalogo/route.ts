import type { NextRequest } from "next/server";
import { requireComercioApi } from "@/lib/auth/apiAuth";
import { jsonError, prismaErrorResponse } from "@/lib/api/http";
import { productoService } from "@/lib/services/catalogo.service";
import { filtrarProductos } from "@/lib/services/duplicados.service";

/**
 * Catálogo maestro para el comercio.
 * Sin parámetros devuelve todo (retrocompatible); con ?q= hace una búsqueda
 * tolerante (acentos, mayúsculas, espacios y errores menores de escritura)
 * y con ?categoriaId= filtra por categoría.
 */
export async function GET(request: NextRequest) {
  const access = await requireComercioApi();
  if (!access.ok) return jsonError(access.status, access.error);

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const categoriaId = searchParams.get("categoriaId")?.trim() ?? "";

    const productos = await productoService.list();
    const data =
      q !== "" || categoriaId !== ""
        ? filtrarProductos(productos, q, categoriaId || undefined)
        : productos;
    return Response.json({ data });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
