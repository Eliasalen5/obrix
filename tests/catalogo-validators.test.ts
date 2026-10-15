import { describe, it, expect } from "vitest";
import {
  createCategoriaSchema,
  updateCategoriaSchema,
  createProductoSchema,
  updateProductoSchema,
} from "@/lib/validators/catalogo";

describe("validación catálogo — Categoría", () => {
  it("acepta una categoría válida y aplica orden por defecto", () => {
    const parsed = createCategoriaSchema.safeParse({ nombre: "Cemento y cal" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.nombre).toBe("Cemento y cal");
      expect(parsed.data.orden).toBe(0);
    }
  });

  it("recorta espacios del nombre", () => {
    const parsed = createCategoriaSchema.safeParse({ nombre: "  Hierros  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.nombre).toBe("Hierros");
  });

  it("rechaza nombre demasiado corto", () => {
    expect(createCategoriaSchema.safeParse({ nombre: "x" }).success).toBe(false);
  });

  it("rechaza orden no entero o negativo", () => {
    expect(
      createCategoriaSchema.safeParse({ nombre: "Arena", orden: 1.5 }).success,
    ).toBe(false);
    expect(
      createCategoriaSchema.safeParse({ nombre: "Arena", orden: -1 }).success,
    ).toBe(false);
  });

  it("update permite objeto vacío (parcial)", () => {
    expect(updateCategoriaSchema.safeParse({}).success).toBe(true);
  });

  it("update rechaza nombre inválido si se envía", () => {
    expect(updateCategoriaSchema.safeParse({ nombre: "x" }).success).toBe(false);
  });
});

describe("validación catálogo — Producto", () => {
  const base = {
    sku: "CEM-001",
    nombre: "Cemento Loma Negra 50kg",
    unidad: "bolsa 50 kg",
    categoriaId: "cat_123",
  };

  it("acepta producto válido y aplica descripción por defecto", () => {
    const parsed = createProductoSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.descripcion).toBe("");
  });

  it("rechaza si falta SKU", () => {
    expect(
      createProductoSchema.safeParse({
        nombre: base.nombre,
        unidad: base.unidad,
        categoriaId: base.categoriaId,
      }).success,
    ).toBe(false);
  });

  it("rechaza si falta categoría", () => {
    expect(
      createProductoSchema.safeParse({
        sku: base.sku,
        nombre: base.nombre,
        unidad: base.unidad,
      }).success,
    ).toBe(false);
  });

  it("rechaza nombre demasiado corto", () => {
    expect(
      createProductoSchema.safeParse({ ...base, nombre: "x" }).success,
    ).toBe(false);
  });

  it("rechaza descripción demasiado larga", () => {
    expect(
      createProductoSchema.safeParse({ ...base, descripcion: "a".repeat(501) })
        .success,
    ).toBe(false);
  });

  it("update permite objeto vacío (parcial)", () => {
    expect(updateProductoSchema.safeParse({}).success).toBe(true);
  });
});
