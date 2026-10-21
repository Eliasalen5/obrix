import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Alias legacy de la API. Los handlers viven en versiones (`/api/v1/*`); las
 * rutas sin versión (`/api/*`) se reescriben a v1 para no romper a los clientes
 * web ya desplegados, y se marcan como deprecadas vía headers estándar.
 *
 * - `/api/v1/*` y `/api/auth/*` (NextAuth) pasan sin tocar.
 * - `/api/*` -> rewrite a `/api/v1/*` con `Deprecation` y `Link`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const rewritePath = `/api/v1${pathname.slice("/api".length)}${search}`;
  const successor = `/api/v1${pathname.slice("/api".length)}`;

  const response = NextResponse.rewrite(new URL(rewritePath, request.url));
  response.headers.set("Deprecation", "true");
  response.headers.set("Link", `<${successor}>; rel="successor-version"`);
  return response;
}

export const config = {
  // Aplica a /api/* excepto /api/v1/* (ya versionado) y /api/auth/* (NextAuth).
  matcher: ["/api/((?!v1/|auth/).*)"],
};
