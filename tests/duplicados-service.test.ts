import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    producto: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import {
  detectarCoincidencias,
  filtrarProductos,
  normalizarClave,
  similitud,
  type ProductoComparable,
} from "@/lib/services/duplicados.service";
import type { PropuestaProductoInput } from "@/lib/validators/solicitud";

function prod(over: Partial<ProductoComparable> & { id: string }): ProductoComparable {
  return {
    sku: over.id.toUpperCase(),
    nombre: "Producto",
    unidad: "unidad",
    codigoBarras: null,
    fabricante: "",
    codigoFabricante: null,
    marca: "",
    ...over,
  };
}

const propuesta = (
  over: Partial<PropuestaProductoInput> = {},
): PropuestaProductoInput => ({
  nombre: "Cemento Portland 50 KG",
  categoriaId: "c1",
  unidad: "bolsa 50 kg",
  marca: "Loma Negra",
  fabricante: "",
  codigoBarras: "",
  codigoFabricante: "",
  descripcion: "",
  imagenUrl: "",
  atributos: {},
  precio: 12000,
  stock: 0,
  ...over,
});

describe("normalizarClave", () => {
  it("unifica mayúsculas, acentos, espacios y separa dígitos de letras", () => {
    expect(normalizarClave("Cemento Portland 50 KG")).toBe(
      normalizarClave("cemento   portland 50kg"),
    );
  });

  it("homologa unidades equivalentes sin convertir entre distintas", () => {
    expect(normalizarClave("25 kilos")).toBe(normalizarClave("25 kg"));
    expect(normalizarClave("1,5 mm2")).toContain("1 5 mm 2");
    // 50 kg NO equivale a 25 kg
    expect(normalizarClave("50 kg")).not.toBe(normalizarClave("25 kg"));
  });
});

describe("detección de duplicados — nivel 1 (exacta)", () => {
  it("coincide por código de barras", () => {
    const catalogo = [
      prod({ id: "p1", nombre: "Cemento", codigoBarras: "7791234567890" }),
    ];
    const res = detectarCoincidencias(
      propuesta({ codigoBarras: "7791-234567890" }),
      catalogo,
    );
    expect(res).toHaveLength(1);
    expect(res[0].nivel).toBe("exacta");
    expect(res[0].producto.id).toBe("p1");
  });

  it("coincide por fabricante + código de fabricante", () => {
    const catalogo = [
      prod({ id: "p2", fabricante: "Acindar", codigoFabricante: "AC-100" }),
    ];
    const res = detectarCoincidencias(
      propuesta({ fabricante: "acindar", codigoFabricante: "ac100" }),
      catalogo,
    );
    expect(res[0].nivel).toBe("exacta");
  });

  it("no inventa coincidencia si falta el código de barras", () => {
    const catalogo = [prod({ id: "p1", codigoBarras: "123" })];
    const res = detectarCoincidencias(propuesta(), catalogo);
    expect(res.every((c) => c.nivel !== "exacta")).toBe(true);
  });
});

describe("detección de duplicados — nivel 2 (normalizada)", () => {
  it("detecta nombres equivalentes como coincidencia normalizada", () => {
    const catalogo = [
      prod({ id: "p1", nombre: "cemento portland 50kg", unidad: "bolsa 50 KG", marca: "Loma Negra" }),
    ];
    const res = detectarCoincidencias(propuesta(), catalogo);
    expect(res[0].nivel).toBe("normalizada");
  });
});

describe("detección de duplicados — nivel 3 (aproximada)", () => {
  it("propone coincidencias aproximadas sin afirmar igualdad", () => {
    const catalogo = [
      prod({ id: "p1", nombre: "Cemento Portland 50 kg gris", unidad: "bolsa 50 kg", marca: "Loma Negra" }),
    ];
    const res = detectarCoincidencias(propuesta(), catalogo);
    expect(res[0].nivel).toBe("aproximada");
    expect(res[0].puntaje).toBeGreaterThanOrEqual(0.6);
  });
});

describe("productos que NO deben confundirse", () => {
  const variantes: [string, ProductoComparable, PropuestaProductoInput][] = [
    [
      "cemento 25 kg vs 50 kg",
      prod({ id: "p1", nombre: "Cemento 25 kg", unidad: "bolsa 25 kg" }),
      propuesta({ nombre: "Cemento 50 kg", unidad: "bolsa 50 kg" }),
    ],
    [
      "cable 1,5 mm² vs 2,5 mm²",
      prod({ id: "p1", nombre: "Cable 1,5 mm2", unidad: "m" }),
      propuesta({ nombre: "Cable 2,5 mm2", unidad: "m" }),
    ],
    [
      "pintura 1 l vs 20 l",
      prod({ id: "p1", nombre: "Pintura 1 litro", unidad: "l" }),
      propuesta({ nombre: "Pintura 20 litros", unidad: "l" }),
    ],
    [
      "marcas distintas",
      prod({ id: "p1", nombre: "Cemento 50 kg", unidad: "bolsa 50 kg", marca: "MarcaB" }),
      propuesta({ marca: "MarcaA" }),
    ],
  ];

  for (const [titulo, existente, prop] of variantes) {
    it(`no fusiona: ${titulo}`, () => {
      const res = detectarCoincidencias(prop, [existente]);
      expect(res).toHaveLength(0);
    });
  }
});

describe("similitud y búsqueda tolerante", () => {
  it("similitud alta entre textos con diferencia de escritura", () => {
    expect(similitud("cemento portland 50 kg", "cemento portland 50kg")).toBeGreaterThan(0.95);
  });

  it("búsqueda tolera acentos y errores menores", () => {
    const catalogo = [
      prod({ id: "p1", nombre: "Herramienta de medición", unidad: "unidad" }),
      prod({ id: "p2", nombre: "Cemento", unidad: "bolsa 50 kg" }),
    ];
    const res = filtrarProductos(catalogo, "medicion");
    expect(res.map((p) => p.id)).toContain("p1");
    expect(res.map((p) => p.id)).not.toContain("p2");
  });

  it("filtro por categoría", () => {
    const catalogo = [
      { ...prod({ id: "p1", nombre: "Cemento" }), categoriaId: "c1" },
      { ...prod({ id: "p2", nombre: "Cemento gris" }), categoriaId: "c2" },
    ];
    const res = filtrarProductos(catalogo, "", "c2");
    expect(res.map((p) => p.id)).toEqual(["p2"]);
  });
});
