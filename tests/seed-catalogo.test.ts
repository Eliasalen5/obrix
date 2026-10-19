import { describe, it, expect } from "vitest";
import { normalizarTexto } from "@/lib/services/cotizador.service";
import {
  categorias,
  comerciosDemo,
  productosBase,
} from "../prisma/catalogo.seed-data";

const SKU_RE = /^OBR-\d{3}$/;

describe("catálogo semilla: integridad", () => {
  it("tiene 200 productos repartidos en 16 categorías", () => {
    expect(productosBase).toHaveLength(200);
    expect(categorias).toHaveLength(16);
  });

  it("no repite SKUs y todos respetan el formato OBR-###", () => {
    const skus = productosBase.map((p) => p.sku);
    const unicos = new Set(skus);
    expect(unicos.size).toBe(skus.length);

    const malformados = skus.filter((sku) => !SKU_RE.test(sku));
    expect(malformados).toEqual([]);
  });

  it("no deja huecos en la numeración OBR-001 … OBR-200", () => {
    const esperados = Array.from(
      { length: 200 },
      (_, i) => `OBR-${String(i + 1).padStart(3, "0")}`,
    );
    const skus = new Set(productosBase.map((p) => p.sku));
    const faltantes = esperados.filter((sku) => !skus.has(sku));
    expect(faltantes).toEqual([]);
  });

  it("no repite productos: los nombres son únicos una vez normalizados", () => {
    const porNombre = new Map<string, string[]>();
    for (const p of productosBase) {
      const clave = normalizarTexto(p.nombre);
      const lista = porNombre.get(clave) ?? [];
      lista.push(p.sku);
      porNombre.set(clave, lista);
    }

    const repetidos = [...porNombre.entries()]
      .filter(([, skus]) => skus.length > 1)
      .map(([nombre, skus]) => `${nombre} → ${skus.join(", ")}`);

    expect(repetidos).toEqual([]);
  });

  it("cada producto tiene nombre, unidad y descripción", () => {
    const incompletos = productosBase
      .filter(
        (p) =>
          p.nombre.trim() === "" ||
          p.unidad.trim() === "" ||
          p.descripcion.trim() === "",
      )
      .map((p) => p.sku);
    expect(incompletos).toEqual([]);
  });

  it("toda categoría declarada es única y tiene productos", () => {
    const nombres = categorias.map((c) => c.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);

    const ordenes = categorias.map((c) => c.orden);
    expect(new Set(ordenes).size).toBe(ordenes.length);

    const usadas = new Set(productosBase.map((p) => p.categoria));
    const vacias = nombres.filter((n) => !usadas.has(n));
    expect(vacias).toEqual([]);
  });

  it("todo producto apunta a una categoría existente", () => {
    const catNames = new Set(categorias.map((c) => c.nombre));
    const huerfanos = productosBase
      .filter((p) => !catNames.has(p.categoria))
      .map((p) => `${p.sku}: ${p.categoria}`);
    expect(huerfanos).toEqual([]);
  });

  it("las ofertas demo referencian productos que existen", () => {
    const skus = new Set(productosBase.map((p) => p.sku));
    const invalidas: string[] = [];

    for (const c of comerciosDemo) {
      for (const o of c.ofertas) {
        if (!skus.has(o.sku)) invalidas.push(`${c.email}: ${o.sku}`);
        if (o.precio <= 0) invalidas.push(`${c.email}: precio ${o.sku}`);
        if (o.stock < 0) invalidas.push(`${c.email}: stock ${o.sku}`);
      }
    }

    expect(invalidas).toEqual([]);
  });

  it("los SKUs de cada comercio no se repiten entre sí", () => {
    for (const c of comerciosDemo) {
      const skus = c.ofertas.map((o) => o.sku);
      expect(new Set(skus).size, c.email).toBe(skus.length);
    }
  });
});
