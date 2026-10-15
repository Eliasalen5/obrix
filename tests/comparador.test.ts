import { describe, it, expect } from "vitest";
import {
  compararOfertas,
  type MaterialCotizable,
  type OfertaConComercio,
} from "@/lib/services/cotizador.service";

function comercio(id: string, nombre: string, lat = 0, lng = 0) {
  return { id, nombre, direccion: `Calle ${id}`, telefono: "555", lat, lng };
}

function material(
  materialId: string,
  productoId: string | null,
  cantidad = 1,
  unidad = "unidad",
  unidadProducto: string | null = unidad,
): MaterialCotizable {
  return { materialId, nombre: `M-${materialId}`, cantidad, unidad, productoId, unidadProducto };
}

const OFERTAS: OfertaConComercio[] = [
  { productoId: "p1", precio: 100, stock: 100, comercio: comercio("c1", "Ferretería A") },
  { productoId: "p2", precio: 10, stock: 100, comercio: comercio("c1", "Ferretería A") },
  { productoId: "p1", precio: 90, stock: 100, comercio: comercio("c2", "Ferretería B") },
];

describe("compararOfertas", () => {
  it("ordena por cobertura y luego por total", () => {
    const r = compararOfertas(
      [material("m1", "p1", 2), material("m2", "p2", 100)],
      OFERTAS,
    );

    expect(r.rankingPor).toBe("cobertura_precio");
    expect(r.comercios.map((c) => c.comercioId)).toEqual(["c1", "c2"]);

    const [c1, c2] = r.comercios;
    expect(c1.itemsCubiertos).toBe(2);
    expect(c1.cubreTodo).toBe(true);
    expect(c1.esTotalCompleto).toBe(true);
    expect(c1.total).toBeCloseTo(100 * 2 + 10 * 100, 2);

    expect(c2.itemsCubiertos).toBe(1);
    expect(c2.cubreTodo).toBe(false);
    expect(c2.esTotalCompleto).toBe(false);
    expect(c2.total).toBeCloseTo(90 * 2, 2);
    expect(c2.faltantes).toEqual([{ materialId: "m2", nombre: "M-m2" }]);
  });

  it("desempata por total cuando la cobertura es igual", () => {
    const ofertas: OfertaConComercio[] = [
      { productoId: "p1", precio: 100, stock: 5, comercio: comercio("caro", "Caro") },
      { productoId: "p1", precio: 50, stock: 5, comercio: comercio("barato", "Barato") },
    ];
    const r = compararOfertas([material("m1", "p1", 1)], ofertas);
    expect(r.comercios.map((c) => c.comercioId)).toEqual(["barato", "caro"]);
  });

  it("reporta materiales sin match y la mejor opción por ítem", () => {
    const r = compararOfertas(
      [material("m1", "p1", 2), material("m2", null)],
      OFERTAS,
    );

    expect(r.itemsTotales).toBe(2);
    expect(r.sinMatch).toEqual([
      { materialId: "m2", nombre: "M-m2", cantidad: 1, unidad: "unidad" },
    ]);
    expect(r.items).toContainEqual({
      materialId: "m1",
      nombre: "M-m1",
      mejor: { comercioId: "c2", nombre: "Ferretería B", precioUnitario: 90 },
    });
    expect(r.advertencias.join(" ")).toContain("no se pudieron asociar");
  });

  it("marca unidad distinta", () => {
    const r = compararOfertas(
      [material("m1", "p1", 1, "unidad", "kg")],
      OFERTAS,
    );
    expect(r.advertencias.join(" ")).toContain("unidad distinta");
  });

  it("advierte por stock insuficiente", () => {
    const ofertas: OfertaConComercio[] = [
      { productoId: "p1", precio: 100, stock: 1, comercio: comercio("c1", "A") },
    ];
    const r = compararOfertas([material("m1", "p1", 10)], ofertas);
    expect(r.advertencias.join(" ")).toContain("stock declarado");
  });

  it("sin ofertas devuelve lista vacía pero items con mejor null", () => {
    const r = compararOfertas([material("m1", "p1", 1)], []);
    expect(r.comercios).toEqual([]);
    expect(r.items).toEqual([{ materialId: "m1", nombre: "M-m1", mejor: null }]);
  });
});

describe("compararOfertas — cercanía", () => {
  it("sin ubicación, distanciaKm es null", () => {
    const r = compararOfertas([material("m1", "p1", 1)], OFERTAS);
    expect(r.comercios.every((c) => c.distanciaKm === null)).toBe(true);
  });

  it("con ubicación calcula distancia y ordena por cercanía a igual cobertura", () => {
    const ofertas: OfertaConComercio[] = [
      { productoId: "p1", precio: 100, stock: 5, comercio: comercio("cerca", "Cerca", -34.61, -58.38) },
      { productoId: "p1", precio: 50, stock: 5, comercio: comercio("lejos", "Lejos", -34.9, -58.0) },
    ];
    const r = compararOfertas([material("m1", "p1", 1)], ofertas, {
      ubicacion: { lat: -34.6037, lng: -58.3816 },
    });
    expect(r.comercios[0].comercioId).toBe("cerca");
    expect(r.comercios[0].distanciaKm).not.toBeNull();
    expect(r.comercios[0].distanciaKm!).toBeLessThan(r.comercios[1].distanciaKm!);
  });

  it("la cobertura pesa más que la distancia", () => {
    const ofertas: OfertaConComercio[] = [
      { productoId: "p1", precio: 100, stock: 5, comercio: comercio("cerca", "Cerca", -34.6037, -58.3816) },
      { productoId: "p1", precio: 100, stock: 5, comercio: comercio("lejos", "Lejos", -34.9, -58.3) },
      { productoId: "p2", precio: 5, stock: 5, comercio: comercio("lejos", "Lejos", -34.9, -58.3) },
    ];
    const r = compararOfertas(
      [material("m1", "p1", 1), material("m2", "p2", 1)],
      ofertas,
      { ubicacion: { lat: -34.6037, lng: -58.3816 } },
    );
    expect(r.comercios[0].comercioId).toBe("lejos");
    expect(r.comercios[0].itemsCubiertos).toBe(2);
  });
});
