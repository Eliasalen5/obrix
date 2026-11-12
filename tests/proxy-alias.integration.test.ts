import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "@/proxy";

function req(url: string) {
  return new NextRequest(url);
}

describe("proxy — alias legacy /api/* → /api/v1/*", () => {
  it("matcher excluye /api/v1 y /api/auth y cubre /cliente", () => {
    expect(config.matcher).toEqual([
      "/api/((?!v1/|auth/).*)",
      "/cliente/:path*",
    ]);
  });

  it("expone la ruta original de /cliente en un header interno", () => {
    const res = proxy(req("http://localhost/cliente/proyecto?auto=1"));

    expect(res.headers.get("x-middleware-request-x-obrix-pathname")).toBe(
      "/cliente/proyecto?auto=1",
    );
  });

  it("reescribe /api/pedidos → /api/v1/pedidos y marca deprecación", () => {
    const res = proxy(req("http://localhost/api/pedidos"));

    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/api/v1/pedidos",
    );
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Link")).toBe(
      '</api/v1/pedidos>; rel="successor-version"',
    );
  });

  it("preserva querystring en el rewrite", () => {
    const res = proxy(req("http://localhost/api/admin/solicitudes?estado=PENDIENTE_REVISION"));

    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost/api/v1/admin/solicitudes?estado=PENDIENTE_REVISION",
    );
    expect(res.headers.get("Link")).toBe(
      '</api/v1/admin/solicitudes>; rel="successor-version"',
    );
  });
});
