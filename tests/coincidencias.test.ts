import { describe, expect, it } from "vitest";
import {
  clavesDeIdentificacion,
  clasificarOferta,
} from "@/lib/vision/coincidencias";
import type { OfertaPublica } from "@/lib/ofertas/buscarOfertas";

function ofertaCon(busqueda: string): OfertaPublica {
  return {
    id: busqueda,
    precio: 100,
    stock: 1,
    marca: "",
    presentacion: "",
    producto: {
      nombre: busqueda,
      descripcion: "",
      busqueda,
      unidad: "unidad",
      marca: "",
      categoria: { nombre: "Ferreterías" },
    },
    comercio: {
      nombre: "X",
      direccion: "",
      localidad: "",
      provincia: "",
    },
  } as unknown as OfertaPublica;
}

describe("clavesDeIdentificacion", () => {
  it("normaliza y quita stopwords de los términos", () => {
    expect(
      clavesDeIdentificacion({
        objeto: "Tornillo",
        tipo: "x",
        caracteristicas: [],
        incertidumbres: [],
        confianza: "probable",
        terminos: "Tornillo de Acero",
      }),
    ).toEqual(["tornillo", "acero"]);
  });
});

describe("clasificarOferta", () => {
  const caracteristicas = ["Cabeza hexagonal aparente", "Punta mecha aparente"];

  it("marca alta cuando están todas las claves", () => {
    const res = clasificarOferta(
      ofertaCon("tornillo hexagonal"),
      ["tornillo", "hexagonal"],
      caracteristicas,
    );
    expect(res.nivel).toBe("alta");
  });

  it("marca probable cuando aparece al menos la mitad de las claves", () => {
    const res = clasificarOferta(
      ofertaCon("tornillo zincado"),
      ["tornillo", "hexagonal"],
      caracteristicas,
    );
    expect(res.nivel).toBe("probable");
  });

  it("marca similar cuando no coincide suficiente", () => {
    const res = clasificarOferta(
      ofertaCon("tarugo plastico"),
      ["tornillo", "hexagonal"],
      caracteristicas,
    );
    expect(res.nivel).toBe("similar");
  });

  it("sin claves no fuerza coincidencia alta", () => {
    const res = clasificarOferta(ofertaCon("cualquiera"), [], []);
    expect(res.nivel).toBe("similar");
    expect(res.caracteristicasCoincidentes).toEqual([]);
  });

  it("detecta características que aparecen en el producto e ignora genéricos", () => {
    const res = clasificarOferta(
      ofertaCon("tornillo cabeza hexagonal"),
      ["tornillo"],
      caracteristicas,
    );
    expect(res.caracteristicasCoincidentes).toContain("Cabeza hexagonal aparente");
    expect(res.caracteristicasCoincidentes).not.toContain("Punta mecha aparente");
  });
});
