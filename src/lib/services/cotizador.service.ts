import type {
  Alternativa,
  Comparacion,
  ComercioComparado,
  ItemComparado,
  MatchInfo,
  OfertaComparada,
  SinMatch,
  Ubicacion,
} from "@/lib/validators/cotizacion";
import { RANKING_POR } from "@/lib/validators/cotizacion";
import { haversineKm, redondearKm } from "./geo.service";

export const UMBRAL_MATCH = 0.6;
export const MAX_ALTERNATIVAS = 3;

export type ProductoCatalogo = {
  id: string;
  sku: string;
  nombre: string;
  unidad: string;
};

export type OfertaConComercio = {
  productoId: string;
  precio: number;
  stock: number;
  comercio: {
    id: string;
    nombre: string;
    direccion: string;
    telefono: string;
    lat: number;
    lng: number;
  };
};

export type MaterialPorMatchear = {
  nombre: string;
  unidad: string;
  productoId?: string;
};

export type MatchResult = {
  productoId: string | null;
  match: MatchInfo | null;
  alternativas: Alternativa[];
};

export type MaterialCotizable = {
  materialId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  productoId: string | null;
  unidadProducto?: string | null;
};

const STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "para",
  "con",
  "por",
  "y",
  "un",
  "una",
]);

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenizar(texto: string): string[] {
  return normalizarTexto(texto)
    .split(" ")
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function coincideUnidad(a: string, b: string): boolean {
  return normalizarTexto(a) === normalizarTexto(b);
}

export function puntuarMatch(nombre: string, producto: ProductoCatalogo): number {
  const consulta = tokenizar(nombre);
  if (consulta.length === 0) return 0;
  const tokensProducto = new Set(tokenizar(producto.nombre));
  const coincidencias = consulta.filter((token) =>
    tokensProducto.has(token),
  ).length;
  return coincidencias / consulta.length;
}

function aAlternativa(
  producto: ProductoCatalogo,
  score: number,
): Alternativa {
  return {
    productoId: producto.id,
    sku: producto.sku,
    nombre: producto.nombre,
    score: redondear(score),
  };
}

export function matchMateriales(
  materiales: MaterialPorMatchear[],
  productos: ProductoCatalogo[],
): MatchResult[] {
  const porId = new Map(productos.map((p) => [p.id, p]));

  return materiales.map((material) => {
    const override = material.productoId
      ? porId.get(material.productoId)
      : undefined;

    if (override) {
      return {
        productoId: override.id,
        match: {
          productoId: override.id,
          sku: override.sku,
          nombre: override.nombre,
          score: 1,
          coincideUnidad: coincideUnidad(material.unidad, override.unidad),
          unidadProducto: override.unidad,
        },
        alternativas: [],
      };
    }

    const consultaTokens = tokenizar(material.nombre).length;

    const puntuados = productos
      .map((producto) => ({ producto, score: puntuarMatch(material.nombre, producto) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const difA = Math.abs(tokenizar(a.producto.nombre).length - consultaTokens);
        const difB = Math.abs(tokenizar(b.producto.nombre).length - consultaTokens);
        if (difA !== difB) return difA - difB;
        return a.producto.nombre.localeCompare(b.producto.nombre);
      });

    const mejor = puntuados[0];

    if (!mejor || mejor.score < UMBRAL_MATCH) {
      return {
        productoId: null,
        match: null,
        alternativas: puntuados
          .slice(0, MAX_ALTERNATIVAS)
          .map((c) => aAlternativa(c.producto, c.score)),
      };
    }

    return {
      productoId: mejor.producto.id,
      match: {
        productoId: mejor.producto.id,
        sku: mejor.producto.sku,
        nombre: mejor.producto.nombre,
        score: redondear(mejor.score),
        coincideUnidad: coincideUnidad(material.unidad, mejor.producto.unidad),
        unidadProducto: mejor.producto.unidad,
      },
      alternativas: puntuados
        .slice(1, 1 + MAX_ALTERNATIVAS)
        .map((c) => aAlternativa(c.producto, c.score)),
    };
  });
}

type ComercioAcumulador = ComercioComparado & { cubiertos: Set<string> };

function calcularDistancia(
  comercio: { lat: number; lng: number },
  ubicacion?: Ubicacion | null,
): number | null {
  if (!ubicacion) return null;
  return redondearKm(haversineKm(ubicacion.lat, ubicacion.lng, comercio.lat, comercio.lng));
}

function comercioVacio(
  oferta: OfertaConComercio,
  ubicacion?: Ubicacion | null,
): ComercioAcumulador {
  return {
    comercioId: oferta.comercio.id,
    nombre: oferta.comercio.nombre,
    direccion: oferta.comercio.direccion,
    telefono: oferta.comercio.telefono,
    distanciaKm: calcularDistancia(oferta.comercio, ubicacion),
    itemsCubiertos: 0,
    itemsTotales: 0,
    cubreTodo: false,
    total: 0,
    esTotalCompleto: false,
    faltantes: [],
    detalle: [],
    cubiertos: new Set<string>(),
  };
}

export type OpcionesComparacion = {
  ubicacion?: Ubicacion | null;
};

export function compararOfertas(
  materiales: MaterialCotizable[],
  ofertas: OfertaConComercio[],
  opciones: OpcionesComparacion = {},
): Comparacion {
  const ubicacion = opciones.ubicacion ?? null;
  const itemsTotales = materiales.length;

  const ofertasPorProducto = new Map<string, OfertaConComercio[]>();
  for (const oferta of ofertas) {
    const lista = ofertasPorProducto.get(oferta.productoId) ?? [];
    lista.push(oferta);
    ofertasPorProducto.set(oferta.productoId, lista);
  }

  const porComercio = new Map<string, ComercioAcumulador>();
  const items: ItemComparado[] = [];
  const sinMatch: SinMatch[] = [];
  const advertencias = new Set<string>();

  let unidadesDistintas = 0;
  let stockInsuficiente = 0;

  for (const material of materiales) {
    if (!material.productoId) {
      sinMatch.push({
        materialId: material.materialId,
        nombre: material.nombre,
        cantidad: material.cantidad,
        unidad: material.unidad,
      });
      items.push({ materialId: material.materialId, nombre: material.nombre, mejor: null });
      continue;
    }

    if (
      material.unidadProducto &&
      !coincideUnidad(material.unidad, material.unidadProducto)
    ) {
      unidadesDistintas += 1;
    }

    const ofertasItem = ofertasPorProducto.get(material.productoId) ?? [];

    let mejor: ItemComparado["mejor"] = null;
    for (const oferta of ofertasItem) {
      if (!mejor || oferta.precio < mejor.precioUnitario) {
        mejor = {
          comercioId: oferta.comercio.id,
          nombre: oferta.comercio.nombre,
          precioUnitario: oferta.precio,
        };
      }
    }
    items.push({ materialId: material.materialId, nombre: material.nombre, mejor });

    for (const oferta of ofertasItem) {
      const acumulador =
        porComercio.get(oferta.comercio.id) ?? comercioVacio(oferta, ubicacion);
      porComercio.set(oferta.comercio.id, acumulador);

      const subtotal = redondear(oferta.precio * material.cantidad);
      const detalle: OfertaComparada = {
        materialId: material.materialId,
        nombre: material.nombre,
        cantidad: material.cantidad,
        unidad: material.unidad,
        precioUnitario: oferta.precio,
        subtotal,
        stock: oferta.stock,
      };
      acumulador.detalle.push(detalle);
      acumulador.itemsCubiertos += 1;
      acumulador.total = redondear(acumulador.total + subtotal);
      acumulador.cubiertos.add(material.materialId);

      if (oferta.stock !== -1 && oferta.stock < material.cantidad) {
        stockInsuficiente += 1;
      }
    }
  }

  const comercios: ComercioComparado[] = [...porComercio.values()]
    .map((acumulador) => {
      const faltantes = materiales
        .filter((material) => !acumulador.cubiertos.has(material.materialId))
        .map((material) => ({ materialId: material.materialId, nombre: material.nombre }));
      const cubreTodo = faltantes.length === 0;
      const { cubiertos, ...resto } = acumulador;
      void cubiertos;
      return {
        ...resto,
        itemsTotales,
        cubreTodo,
        esTotalCompleto: cubreTodo,
        faltantes,
      };
    })
    .sort((a, b) => {
      if (b.itemsCubiertos !== a.itemsCubiertos) {
        return b.itemsCubiertos - a.itemsCubiertos;
      }
      if (
        a.distanciaKm !== null &&
        b.distanciaKm !== null &&
        a.distanciaKm !== b.distanciaKm
      ) {
        return a.distanciaKm - b.distanciaKm;
      }
      if (a.total !== b.total) return a.total - b.total;
      return a.nombre.localeCompare(b.nombre);
    });

  if (sinMatch.length > 0) {
    advertencias.add(
      `${sinMatch.length} material(es) no se pudieron asociar al catálogo y no se cotizaron.`,
    );
  }
  if (unidadesDistintas > 0) {
    advertencias.add(
      `${unidadesDistintas} material(es) usan una unidad distinta a la del producto del catálogo; revisá los subtotales.`,
    );
  }
  if (stockInsuficiente > 0) {
    advertencias.add(
      `${stockInsuficiente} ítem(s) superan el stock declarado por el comercio.`,
    );
  }
  if (comercios.some((comercio) => !comercio.cubreTodo)) {
    advertencias.add(
      "Los comercios que no cubren todos los materiales muestran el subtotal de los disponibles, no el precio final del proyecto.",
    );
  }

  return {
    itemsTotales,
    rankingPor: RANKING_POR,
    comercios,
    items,
    sinMatch,
    advertencias: [...advertencias],
  };
}
