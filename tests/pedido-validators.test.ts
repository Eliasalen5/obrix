import { describe, it, expect } from "vitest";
import {
  actualizarEstadoPedidoSchema,
  cancelarPedidoSchema,
  crearPedidoSchema,
  ESTADOS_PEDIDO,
} from "@/lib/validators/pedido";

describe("ESTADOS_PEDIDO", () => {
  it("contiene los 5 estados del flujo", () => {
    expect([...ESTADOS_PEDIDO]).toEqual([
      "PENDIENTE",
      "CONFIRMADO",
      "PREPARADO",
      "ENTREGADO",
      "CANCELADO",
    ]);
  });
});

describe("crearPedidoSchema", () => {
  it("acepta cotización y comercio", () => {
    const r = crearPedidoSchema.safeParse({
      cotizacionId: "cot1",
      comercioId: "com1",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza cotizacionId vacío", () => {
    const r = crearPedidoSchema.safeParse({ cotizacionId: " ", comercioId: "com1" });
    expect(r.success).toBe(false);
  });

  it("rechaza comercioId vacío", () => {
    const r = crearPedidoSchema.safeParse({ cotizacionId: "cot1", comercioId: "" });
    expect(r.success).toBe(false);
  });

  it("descarta claves desconocidas (no permite inyectar clienteId)", () => {
    const r = crearPedidoSchema.safeParse({
      cotizacionId: "cot1",
      comercioId: "com1",
      clienteId: "ajeno",
    });
    expect(r.success).toBe(true);
    if (r.success) expect("clienteId" in r.data).toBe(false);
  });
});

describe("actualizarEstadoPedidoSchema", () => {
  it("acepta un estado válido", () => {
    const r = actualizarEstadoPedidoSchema.safeParse({ estado: "CONFIRMADO" });
    expect(r.success).toBe(true);
  });

  it("rechaza un estado inexistente", () => {
    const r = actualizarEstadoPedidoSchema.safeParse({ estado: "ENVIADO" });
    expect(r.success).toBe(false);
  });
});

describe("cancelarPedidoSchema", () => {
  it("acepta CANCELADO", () => {
    const r = cancelarPedidoSchema.safeParse({ estado: "CANCELADO" });
    expect(r.success).toBe(true);
  });

  it("rechaza cualquier otro estado (cliente solo cancela)", () => {
    const r = cancelarPedidoSchema.safeParse({ estado: "CONFIRMADO" });
    expect(r.success).toBe(false);
  });
});
