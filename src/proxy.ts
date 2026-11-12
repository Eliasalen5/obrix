import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CLIENTE_PREFIX = "/cliente";
const PATHNAME_HEADER = "x-obrix-pathname";

/**
 * Alias legacy de la API. Los handlers viven en versiones (`/api/v1/*`); las
 * rutas sin versión (`/api/*`) se reescriben a v1 para no romper a los clientes
 * web ya desplegados, y se marcan como deprecadas vía headers estándar.
 *
 * - `/api/v1/*` y `/api/auth/*` (NextAuth) pasan sin tocar.
 * - `/api/*` -> rewrite a `/api/v1/*` con `Deprecation` y `Link`.
 * - `/cliente/*` expone su ruta original en un header interno para que el guard
 *   pueda volver al destino correcto después del login.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === CLIENTE_PREFIX || pathname.startsWith(`${CLIENTE_PREFIX}/`)) {
    const headers = new Headers(request.headers);
    headers.set(PATHNAME_HEADER, `${pathname}${search}`);
    return NextResponse.next({ request: { headers } });
  }

  const rewritePath = `/api/v1${pathname.slice("/api".length)}${search}`;
  const successor = `/api/v1${pathname.slice("/api".length)}`;

  const response = NextResponse.rewrite(new URL(rewritePath, request.url));
  response.headers.set("Deprecation", "true");
  response.headers.set("Link", `<${successor}>; rel="successor-version"`);
  return response;
}

export const config = {
  // Aplica a /api/* excepto /api/v1/* (ya versionado) y /api/auth/* (NextAuth),
  // más las rutas de cliente para conservar el destino tras el login.
  matcher: ["/api/((?!v1/|auth/).*)", "/cliente/:path*"],
};
