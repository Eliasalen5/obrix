import { describe, it, expect } from "vitest";
import { ROLES } from "@/lib/auth/constants";
import { puedeTransicionar, redondear2 } from "@/lib/services/pedido-estado";

describe("puedeTransicionar", () => {
  it("el CLIENTE solo puede cancelar un pedido PENDIENTE", () => {
    expect(puedeTransicionar(ROLES.CLIENTE, "PENDIENTE", "CANCELADO")).toBe(true);
    expect(puedeTransicionar(ROLES.CLIENTE, "CONFIRMADO", "CANCELADO")).toBe(
      false,
    );
    expect(puedeTransicionar(ROLES.CLIENTE, "PENDIENTE", "CONFIRMADO")).toBe(
      false,
    );
  });

  it("el COMERCIO avanza el flujo en orden", () => {
    expect(puedeTransicionar(ROLES.COMERCIO, "PENDIENTE", "CONFIRMADO")).toBe(
      true,
    );
    expect(puedeTransicionar(ROLES.COMERCIO, "CONFIRMADO", "PREPARADO")).toBe(
      true,
    );
    expect(puedeTransicionar(ROLES.COMERCIO, "PREPARADO", "ENTREGADO")).toBe(
      true,
    );
  });

  it("el COMERCIO no puede saltear estados", () => {
    expect(puedeTransicionar(ROLES.COMERCIO, "PENDIENTE", "ENTREGADO")).toBe(
      false,
    );
    expect(puedeTransicionar(ROLES.COMERCIO, "PENDIENTE", "PREPARADO")).toBe(
      false,
    );
  });

  it("el COMERCIO puede cancelar mientras no esté entregado", () => {
    expect(puedeTransicionar(ROLES.COMERCIO, "PENDIENTE", "CANCELADO")).toBe(
      true,
    );
    expect(puedeTransicionar(ROLES.COMERCIO, "CONFIRMADO", "CANCELADO")).toBe(
      true,
    );
    expect(puedeTransicionar(ROLES.COMERCIO, "PREPARADO", "CANCELADO")).toBe(
      true,
    );
  });

  it("ENTREGADO y CANCELADO son estados finales", () => {
    expect(puedeTransicionar(ROLES.COMERCIO, "ENTREGADO", "CANCELADO")).toBe(
      false,
    );
    expect(puedeTransicionar(ROLES.COMERCIO, "CANCELADO", "CONFIRMADO")).toBe(
      false,
    );
  });

  it("el ADMIN no maneja pedidos", () => {
    expect(puedeTransicionar(ROLES.ADMIN, "PENDIENTE", "CONFIRMADO")).toBe(false);
  });
});

describe("redondear2", () => {
  it("redondea a dos decimales", () => {
    expect(redondear2(0.1 + 0.2)).toBe(0.3);
    expect(redondear2(1234.567)).toBe(1234.57);
  });
});
