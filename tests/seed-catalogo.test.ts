import { describe, it, expect } from "vitest";
import { normalizarTexto } from "@/lib/services/cotizador.service";
import {
  categorias,
  comerciosDemo,
  productosBase,
} from "../prisma/catalogo.seed-data";

const SKU_RE = /^OBR-\d{3}$/;

const CATEGORIAS_ESPERADAS = [
  "Ferreterías",
  "Corralones y materiales de construcción",
  "Pinturerías",
  "Casas de electricidad",
  "Sanitarios, plomería y gas",
  "Casas de pesca y náutica",
  "Madereras y carpintería",
  "Jardinería, viveros y riego",
  "Cerámicas, pisos y revestimientos",
  "Techos y zinguería",
  "Refrigeración y climatización",
  "Seguridad y cerrajería",
  "Piscinas",
  "Máquinas, herramientas y equipos",
];

describe("catálogo semilla: categorías", () => {
  it("tiene exactamente las 14 categorías del acuerdo, en orden", () => {
    expect(categorias.map((c) => c.nombre)).toEqual(CATEGORIAS_ESPERADAS);
    expect(categorias.map((c) => c.orden)).toEqual(
      CATEGORIAS_ESPERADAS.map((_, i) => i + 1),
    );
  });

  it("no repite nombres ni órdenes y ningún nombre queda vacío", () => {
    const nombres = categorias.map((c) => c.nombre);
    const ordenes = categorias.map((c) => c.orden);

    expect(new Set(nombres).size).toBe(nombres.length);
    expect(new Set(ordenes).size).toBe(ordenes.length);
    expect(nombres.filter((n) => n.trim() === "")).toEqual([]);
  });
});

describe("catálogo semilla: productos", () => {
  it("no repite SKUs y todos respetan el formato OBR-###", () => {
    const skus = productosBase.map((p) => p.sku);
    expect(new Set(skus).size).toBe(skus.length);
    expect(skus.filter((sku) => !SKU_RE.test(sku))).toEqual([]);
  });

  it("no deja huecos en la numeración de los SKUs", () => {
    const numeros = productosBase
      .map((p) => Number(p.sku.slice(4)))
      .sort((a, b) => a - b);

    const esperados = numeros.map((_, i) => i + 1);
    expect(numeros).toEqual(esperados);
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

  it("todo producto apunta a una categoría existente", () => {
    const catNames = new Set(categorias.map((c) => c.nombre));
    const huerfanos = productosBase
      .filter((p) => !catNames.has(p.categoria))
      .map((p) => `${p.sku}: ${p.categoria}`);
    expect(huerfanos).toEqual([]);
  });
});

describe("catálogo semilla: ofertas demo", () => {
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
