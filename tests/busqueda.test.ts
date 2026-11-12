import { describe, it, expect } from "vitest";
import {
  construirBusquedaProducto,
  normalizarClave,
  normalizarTexto,
} from "@/lib/text/busqueda";

describe("normalizarTexto", () => {
  it("quita acentos, pasa a minúsculas y colapsa separadores", () => {
    expect(normalizarTexto("  Herramienta de Medición  ")).toBe(
      "herramienta de medicion",
    );
  });
});

describe("normalizarClave", () => {
  it("homologa unidades y separa dígitos de letras", () => {
    expect(normalizarClave("Cemento 50KG")).toBe("cemento 50 kg");
    expect(normalizarClave("25 kilos")).toBe(normalizarClave("25 kg"));
    expect(normalizarClave("m²")).toBe("m 2");
  });
});

describe("construirBusquedaProducto", () => {
  it("incluye los campos buscables en texto normalizado", () => {
    const texto = construirBusquedaProducto({
      sku: "OBR-001",
      nombre: "Cemento Portland",
      unidad: "bolsa 50 kg",
      descripcion: "Gris",
      marca: "Loma Negra",
      fabricante: "Loma",
      codigoFabricante: "LN-1",
      codigoBarras: "779123",
    });

    expect(texto).toContain("cemento portland");
    expect(texto).toContain("obr 001");
    expect(texto).toContain("loma negra");
    expect(texto).toContain("779123");
    expect(texto).not.toMatch(/[A-ZÁÉÍÓÚ]/);
  });

  it("tolera campos nulos o ausentes", () => {
    expect(construirBusquedaProducto({ nombre: null })).toBe("");
  });
});
