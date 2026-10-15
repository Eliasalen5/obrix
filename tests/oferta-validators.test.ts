import { describe, it, expect } from "vitest";
import {
  createOfertaSchema,
  updateOfertaSchema,
} from "@/lib/validators/oferta";

describe("createOfertaSchema", () => {
  it("acepta datos válidos y aplica defaults", () => {
    const r = createOfertaSchema.safeParse({ productoId: "p1", precio: 100 });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toEqual({
        productoId: "p1",
        precio: 100,
        stock: 0,
        marca: "",
        presentacion: "",
        activo: true,
      });
    }
  });

  it("recorta espacios en productoId y marca", () => {
    const r = createOfertaSchema.safeParse({
      productoId: "  p1  ",
      precio: 10,
      marca: "  Acindar  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.productoId).toBe("p1");
      expect(r.data.marca).toBe("Acindar");
    }
  });

  it("rechaza precio no positivo", () => {
    expect(createOfertaSchema.safeParse({ productoId: "p1", precio: 0 }).success).toBe(false);
    expect(createOfertaSchema.safeParse({ productoId: "p1", precio: -5 }).success).toBe(false);
  });

  it("rechaza productoId vacío", () => {
    expect(createOfertaSchema.safeParse({ productoId: "   ", precio: 10 }).success).toBe(false);
  });

  it("rechaza stock no entero", () => {
    expect(
      createOfertaSchema.safeParse({ productoId: "p1", precio: 10, stock: 1.5 }).success,
    ).toBe(false);
  });

  it("acepta stock -1 (sin control) y rechaza menor a -1", () => {
    expect(
      createOfertaSchema.safeParse({ productoId: "p1", precio: 10, stock: -1 }).success,
    ).toBe(true);
    expect(
      createOfertaSchema.safeParse({ productoId: "p1", precio: 10, stock: -2 }).success,
    ).toBe(false);
  });
});

describe("updateOfertaSchema", () => {
  it("acepta objeto vacío", () => {
    const r = updateOfertaSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({});
  });

  it("no aplica defaults: no pisa campos omitidos", () => {
    const r = updateOfertaSchema.safeParse({ precio: 250 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ precio: 250 });
  });

  it("permite desactivar sin tocar el resto", () => {
    const r = updateOfertaSchema.safeParse({ activo: false });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ activo: false });
  });

  it("rechaza precio inválido", () => {
    expect(updateOfertaSchema.safeParse({ precio: -5 }).success).toBe(false);
    expect(updateOfertaSchema.safeParse({ precio: 0 }).success).toBe(false);
  });
});
