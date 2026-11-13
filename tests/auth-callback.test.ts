import { describe, it, expect } from "vitest";
import {
  agregarCallbackUrl,
  esDestinoPermitidoPorRol,
  mensajeContinuidad,
  resolverCallbackUrl,
} from "@/lib/auth/callback";
import { ROLES } from "@/lib/auth/constants";

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

describe("destinos de callback por rol", () => {
  it("permite al cliente volver al asistente y ver su solicitud de comercio", () => {
    expect(esDestinoPermitidoPorRol(ROLES.CLIENTE, "/cliente/proyecto")).toBe(
      true,
    );
    expect(
      esDestinoPermitidoPorRol(ROLES.CLIENTE, "/comercio/solicitud"),
    ).toBe(true);
    expect(esDestinoPermitidoPorRol(ROLES.CLIENTE, "/cliente?auto=1")).toBe(
      true,
    );
  });

  it("no permite al cliente entrar a rutas de comercio o admin", () => {
    expect(esDestinoPermitidoPorRol(ROLES.CLIENTE, "/comercio/ofertas")).toBe(
      false,
    );
    expect(esDestinoPermitidoPorRol(ROLES.CLIENTE, "/dashboard")).toBe(false);
  });

  it("permite a comercio y admin volver a sus paneles", () => {
    expect(esDestinoPermitidoPorRol(ROLES.COMERCIO, "/comercio/ofertas")).toBe(
      true,
    );
    expect(esDestinoPermitidoPorRol(ROLES.ADMIN, "/dashboard/solicitudes")).toBe(
      true,
    );
  });

  it("rechaza destinos externos aunque el rol coincida", () => {
    expect(esDestinoPermitidoPorRol(ROLES.CLIENTE, "https://evil.com")).toBe(
      false,
    );
  });
});

describe("mensaje de continuidad del login", () => {
  it("explica el retorno al asistente", () => {
    expect(mensajeContinuidad("/cliente/proyecto")).toContain("asistente");
  });

  it("explica el estado de la solicitud de comercio", () => {
    expect(mensajeContinuidad("/comercio/solicitud")).toContain("solicitud");
  });

  it("no muestra aviso sin callback", () => {
    expect(mensajeContinuidad("")).toBeNull();
    expect(mensajeContinuidad(null)).toBeNull();
  });
});
