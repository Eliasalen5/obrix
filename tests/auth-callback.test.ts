import { describe, it, expect } from "vitest";
import { agregarCallbackUrl, resolverCallbackUrl } from "@/lib/auth/callback";

describe("callbackUrl seguro", () => {
  it("acepta rutas internas", () => {
    expect(resolverCallbackUrl("/cliente/proyecto", "/cliente")).toBe(
      "/cliente/proyecto",
    );
    expect(resolverCallbackUrl("/cliente/proyecto?auto=1", "/cliente")).toBe(
      "/cliente/proyecto?auto=1",
    );
  });

  it("rechaza URLs externas o protocol-relative", () => {
    expect(resolverCallbackUrl("https://evil.com", "/cliente")).toBe("/cliente");
    expect(resolverCallbackUrl("//evil.com", "/cliente")).toBe("/cliente");
    expect(resolverCallbackUrl("/\\evil.com", "/cliente")).toBe("/cliente");
    expect(resolverCallbackUrl(null, "/cliente")).toBe("/cliente");
  });

  it("agrega callbackUrl solo cuando es seguro", () => {
    expect(agregarCallbackUrl("/registro/cliente", "/cliente/proyecto")).toBe(
      "/registro/cliente?callbackUrl=%2Fcliente%2Fproyecto",
    );
    expect(agregarCallbackUrl("/registro/cliente", "https://evil.com")).toBe(
      "/registro/cliente",
    );
  });
});
