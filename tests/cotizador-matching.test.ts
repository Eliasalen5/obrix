import { describe, it, expect } from "vitest";
import {
  matchMateriales,
  normalizarTexto,
  puntuarMatch,
  tokenizar,
  UMBRAL_MATCH,
  type ProductoCatalogo,
} from "@/lib/services/cotizador.service";

const PRODUCTOS: ProductoCatalogo[] = [
  { id: "p1", sku: "OBR-001", nombre: "Cemento Portland 50 kg", unidad: "bolsa 50 kg" },
  { id: "p2", sku: "OBR-002", nombre: "Cemento de Albañilería 50 kg", unidad: "bolsa 50 kg" },
  { id: "p3", sku: "OBR-005", nombre: "Ladrillo Común 8x18x33 cm", unidad: "unidad" },
  { id: "p4", sku: "OBR-006", nombre: "Ladrillo Hueco 8x18x33 cm", unidad: "unidad" },
  { id: "p5", sku: "OBR-010", nombre: "Arena Fina", unidad: "m³" },
  { id: "p6", sku: "OBR-011", nombre: "Arena Gruesa", unidad: "m³" },
  { id: "p7", sku: "OBR-015", nombre: "Hierro 8 mm", unidad: "kg" },
  { id: "p8", sku: "OBR-066", nombre: "Pala", unidad: "unidad" },
  { id: "p9", sku: "OBR-065", nombre: "Cabo de Madera para Pala", unidad: "unidad" },
];

describe("normalizarTexto / tokenizar", () => {
  it("quita acentos, signos y mayúsculas", () => {
    expect(normalizarTexto("Caño PVC 110 mm (Sanitario)")).toBe(
      "cano pvc 110 mm sanitario",
    );
  });

  it("tokeniza quitando stopwords", () => {
    expect(tokenizar("Cemento de Albañilería")).toEqual([
      "cemento",
      "albanileria",
    ]);
  });
});

describe("puntuarMatch", () => {
  it("da 1 cuando todos los tokens coinciden", () => {
    expect(puntuarMatch("Cemento de albañilería", PRODUCTOS[1])).toBe(1);
  });

  it("da la fracción de tokens coincidentes", () => {
    expect(puntuarMatch("Arena gruesa", PRODUCTOS[4])).toBeCloseTo(0.5, 5);
  });

  it("da 0 sin tokens útiles", () => {
    expect(puntuarMatch("de la", PRODUCTOS[0])).toBe(0);
  });
});

describe("matchMateriales", () => {
  it("matchea por tokens al producto correcto", () => {
    const [r] = matchMateriales(
      [{ nombre: "Cemento de albañilería", unidad: "bolsa 50 kg" }],
      PRODUCTOS,
    );
    expect(r.productoId).toBe("p2");
    expect(r.match?.sku).toBe("OBR-002");
    expect(r.match?.coincideUnidad).toBe(true);
  });

  it("prefiere el nombre más cercano ante empate (Pala vs Cabo ... Pala)", () => {
    const [r] = matchMateriales([{ nombre: "Pala", unidad: "unidad" }], PRODUCTOS);
    expect(r.productoId).toBe("p8");
  });

  it("marca sin match por debajo del umbral y ofrece alternativas", () => {
    const [r] = matchMateriales(
      [{ nombre: "Chapa de hierro", unidad: "unidad" }],
      PRODUCTOS,
    );
    expect(r.match).toBeNull();
    expect(r.productoId).toBeNull();
    expect(r.alternativas.length).toBeGreaterThan(0);
    expect(r.alternativas[0].productoId).toBe("p7");
    expect(r.alternativas[0].score).toBeLessThan(UMBRAL_MATCH);
  });

  it("respeta el productoId provisto (override)", () => {
    const [r] = matchMateriales(
      [{ nombre: "lo que sea", unidad: "m³", productoId: "p5" }],
      PRODUCTOS,
    );
    expect(r.productoId).toBe("p5");
    expect(r.match?.score).toBe(1);
    expect(r.alternativas).toEqual([]);
  });

  it("detecta diferencia de unidad", () => {
    const [r] = matchMateriales(
      [{ nombre: "Hierro del 8 mm", unidad: "unidad" }],
      PRODUCTOS,
    );
    expect(r.productoId).toBe("p7");
    expect(r.match?.coincideUnidad).toBe(false);
    expect(r.match?.unidadProducto).toBe("kg");
  });

  it("ignora un override inexistente y matchea automáticamente", () => {
    const [r] = matchMateriales(
      [{ nombre: "Arena gruesa", unidad: "m³", productoId: "no-existe" }],
      PRODUCTOS,
    );
    expect(r.productoId).toBe("p6");
  });
});
