import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "@/proxy";

function req(url: string) {
  return new NextRequest(url);
}

describe("proxy — alias legacy /api/* → /api/v1/*", () => {
  it("matcher excluye /api/v1 y /api/auth", () => {
    expect(config.matcher).toEqual(["/api/((?!v1/|auth/).*)"]);
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
