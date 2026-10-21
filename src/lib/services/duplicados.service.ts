import { prisma } from "@/lib/prisma";
import { normalizarTexto } from "@/lib/services/cotizador.service";
import type { PropuestaProductoInput } from "@/lib/validators/solicitud";

/**
 * Detección de duplicados del catálogo maestro.
 *
 * Nivel 1 — coincidencia exacta por identificadores confiables
 *           (código de barras, fabricante + código de fabricante).
 * Nivel 2 — coincidencia normalizada (nombre/marca/medidas equivalentes).
 * Nivel 3 — coincidencia aproximada (similitud de tokens) para mostrar
 *           candidatos al comercio/administrador, nunca para fusionar solo.
 *
 * Las variantes incompatibles (distinta medida/presentación o distinta marca)
 * se descartan: no se fusionan productos realmente distintos.
 */

// Unidades equivalentes (solo sinónimos inequívocos; sin conversiones)
const UNIDADES_EQUIVALENTES: Record<string, string> = {
  kg: "kg",
  kgs: "kg",
  kilo: "kg",
  kilos: "kg",
  quilos: "kg",
  quilo: "kg",
  g: "g",
  gramo: "g",
  gramos: "g",
  l: "l",
  lt: "l",
  lts: "l",
  litro: "l",
  litros: "l",
  ml: "ml",
  mililitros: "ml",
  m: "m",
  mt: "m",
  mts: "m",
  metro: "m",
  metros: "m",
  cm: "cm",
  centimetros: "cm",
  mm: "mm",
  milimetros: "mm",
  m2: "m2",
  mts2: "m2",
  cm2: "cm2",
  mm2: "mm2",
  caja: "caja",
  cajas: "caja",
  bolsa: "bolsa",
  bolsas: "bolsa",
  rollo: "rollo",
  rollos: "rollo",
  tubo: "tubo",
  tubos: "tubo",
};

// Nivel 3: umbral mínimo de similitud para proponer un candidato
export const UMBRAL_APROXIMADO = 0.6;

export type ProductoComparable = {
  id: string;
  sku: string;
  nombre: string;
  unidad: string;
  codigoBarras?: string | null;
  fabricante?: string | null;
  codigoFabricante?: string | null;
  marca?: string | null;
};

export type NivelCoincidencia = "exacta" | "normalizada" | "aproximada";

export type Coincidencia<T extends ProductoComparable = ProductoComparable> = {
  producto: T;
  nivel: NivelCoincidencia;
  puntaje: number; // 0..1
  por: string; // identificador o criterio que coincidió
};

/** Minúsculas, sin acentos, separa dígitos de letras y homologa unidades. */
export function normalizarClave(texto: string): string {
  // "m²" -> "m2" y homologa unidades ANTES de separar dígitos/letras,
  // para que unidades con dígito ("m2", "mm2", "mts2") no se partan.
  const pre = normalizarTexto(texto)
    .replace(/²/g, "2")
    .split(" ")
    .map((t) => UNIDADES_EQUIVALENTES[t] ?? t)
    .join(" ");
  return (
    pre
      // "50kg" -> "50 kg"
      .replace(/(\d)([a-z])/g, "$1 $2")
      .replace(/([a-z])(\d)/g, "$1 $2")
  )
    .split(" ")
    .filter(Boolean)
    .join(" ");
}

function normalizarIdentificador(valor: string | null | undefined): string {
  return normalizarTexto(valor ?? "").replace(/[^a-z0-9]/g, "");
}

function normalizarMarca(valor: string | null | undefined): string {
  return normalizarTexto(valor ?? "");
}

/** Cantidades escritas en el texto (decimales con , o .). */
function medidasDe(texto: string): number[] {
  const limpio = normalizarTexto(texto).replace(/(\d),(\d)/g, "$1.$2");
  const encontrados = limpio.match(/\d+(?:\.\d+)?/g) ?? [];
  return [...new Set(encontrados.map(Number))].sort((a, b) => a - b);
}

function mismasMedidas(a: string, b: string): boolean {
  const ma = medidasDe(a);
  const mb = medidasDe(b);
  // Si alguno no declara medidas, no hay evidencia de incompatibilidad
  if (ma.length === 0 || mb.length === 0) return true;
  if (ma.length !== mb.length) return false;
  return ma.every((v, i) => v === mb[i]);
}

function marcasCompatibles(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const ma = normalizarMarca(a);
  const mb = normalizarMarca(b);
  if (ma === "" || mb === "") return true;
  return ma === mb;
}

function tokens(texto: string): string[] {
  return normalizarClave(texto)
    .split(" ")
    .filter((t) => t !== "");
}

/** Similitud de Dice (0..1) sobre los tokens normalizados. */
export function similitud(a: string, b: string): number {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let iguales = 0;
  for (const t of ta) if (tb.has(t)) iguales += 1;
  return (2 * iguales) / (ta.size + tb.size);
}

function claveTexto(p: {
  nombre: string;
  marca?: string | null;
  fabricante?: string | null;
  unidad?: string | null;
}): string {
  return [p.nombre, p.marca ?? "", p.fabricante ?? "", p.unidad ?? ""]
    .filter(Boolean)
    .join(" ");
}

/**
 * Detecta coincidencias en una lista de productos (función pura, testeable).
 * Los identificadores confiables cortan la búsqueda (nivel 1).
 */
export function detectarCoincidencias<T extends ProductoComparable>(
  propuesta: Pick<
    PropuestaProductoInput,
    "nombre" | "marca" | "fabricante" | "codigoBarras" | "codigoFabricante" | "unidad"
  >,
  productos: T[],
): Coincidencia<T>[] {
  // Nivel 1a: código de barras (identificador confiable)
  const barras = normalizarIdentificador(propuesta.codigoBarras);
  if (barras !== "") {
    return productos
      .filter((p) => normalizarIdentificador(p.codigoBarras) === barras)
      .map((producto) => ({
        producto,
        nivel: "exacta" as const,
        puntaje: 1,
        por: "codigoBarras",
      }));
  }

  // Nivel 1b: fabricante + código de fabricante (ambos juntos)
  const fabricante = normalizarIdentificador(propuesta.fabricante);
  const codFab = normalizarIdentificador(propuesta.codigoFabricante);
  if (fabricante !== "" && codFab !== "") {
    const porCodigo = productos.filter(
      (p) =>
        normalizarIdentificador(p.fabricante) === fabricante &&
        normalizarIdentificador(p.codigoFabricante) === codFab,
    );
    if (porCodigo.length > 0) {
      return porCodigo.map((producto) => ({
        producto,
        nivel: "exacta" as const,
        puntaje: 1,
        por: "codigoFabricante",
      }));
    }
  }

  const clavePropuesta = normalizarClave(claveTexto(propuesta));
  const resultados: Coincidencia<T>[] = [];

  for (const p of productos) {
    const compatible =
      mismasMedidas(clavePropuesta, normalizarClave(claveTexto(p))) &&
      marcasCompatibles(propuesta.marca, p.marca);
    if (!compatible) continue;

    // Nivel 2: clave normalizada idéntica
    const claveProducto = normalizarClave(claveTexto(p));
    if (claveProducto !== "" && claveProducto === clavePropuesta) {
      resultados.push({ producto: p, nivel: "normalizada", puntaje: 0.95, por: "nombre" });
      continue;
    }

    // Nivel 3: similitud aproximada
    const puntaje = similitud(clavePropuesta, claveProducto);
    if (puntaje >= UMBRAL_APROXIMADO) {
      resultados.push({ producto: p, nivel: "aproximada", puntaje, por: "similitud" });
    }
  }

  return resultados.sort((a, b) => b.puntaje - a.puntaje).slice(0, 5);
}

/** Busca coincidencias contra el catálogo maestro (nivel 1 corta el scan). */
export async function buscarCoincidencias(
  propuesta: Pick<
    PropuestaProductoInput,
    "nombre" | "marca" | "fabricante" | "codigoBarras" | "codigoFabricante" | "unidad"
  >,
): Promise<Coincidencia[]> {
  const productos = await prisma.producto.findMany({});
  return detectarCoincidencias(propuesta, productos);
}

type ProductoBusqueda = ProductoComparable & {
  descripcion?: string | null;
  categoriaId?: string;
};

/**
 * Búsqueda tolerante del catálogo: acentos, mayúsculas, espacios y errores
 * menores de escritura (fallback por similitud cuando el exacto no da).
 */
export function filtrarProductos<T extends ProductoBusqueda>(
  productos: T[],
  q: string,
  categoriaId?: string,
): T[] {
  const consultas = tokens(q);
  if (consultas.length === 0) {
    return categoriaId
      ? productos.filter((p) => p.categoriaId === categoriaId)
      : productos;
  }
  const base = categoriaId
    ? productos.filter((p) => p.categoriaId === categoriaId)
    : productos;

  const claveConsulta = consultas.join(" ");
  const porClave = base.map((p) => {
    const haystack = normalizarClave(
      [
        p.nombre,
        p.sku,
        p.unidad,
        p.descripcion ?? "",
        p.marca ?? "",
        p.fabricante ?? "",
        p.codigoFabricante ?? "",
        p.codigoBarras ?? "",
      ].join(" "),
    );
    const coincide = consultas.every((t) => haystack.includes(t));
    return { p, coincide, puntaje: similitud(claveConsulta, haystack) };
  });

  const exactos = porClave.filter((r) => r.coincide).map((r) => r.p);
  if (exactos.length > 0) return exactos;

  // Fallback tolerante a errores de escritura
  return porClave
    .filter((r) => r.puntaje >= 0.45)
    .sort((a, b) => b.puntaje - a.puntaje)
    .map((r) => r.p);
}
