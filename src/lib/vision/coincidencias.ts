import type { OfertaPublica } from "@/lib/ofertas/buscarOfertas";
import { normalizarClave } from "@/lib/text/busqueda";
import type {
  IdentificacionVisual,
  NivelCoincidencia,
} from "@/lib/validators/vision";

// Palabras vacías y genéricos del vocabulario de la IA que no aportan matching.
const STOPWORDS = new Set([
  "de", "del", "el", "la", "los", "las", "y", "o", "con", "para", "en", "a",
  "al", "un", "una", "por",
  "aparente", "aparentemente", "visible", "visibles", "tipo", "forma", "color",
]);

function filtrar(tokens: string[], minLen: number): string[] {
  return tokens.filter((t) => t && !STOPWORDS.has(t) && t.length >= minLen);
}

/** Tokens significativos de una frase (vinen de normalizarClave). */
function tokens(texto: string, minLen: number): string[] {
  return filtrar(normalizarClave(texto).split(" "), minLen);
}

/** Texto normalizado del producto/oferta sobre el que se buscan coincidencias. */
function textoProducto(oferta: OfertaPublica): string {
  return normalizarClave(
    [
      oferta.producto.busqueda,
      oferta.producto.nombre,
      oferta.producto.descripcion,
      oferta.producto.marca,
      oferta.marca,
      oferta.presentacion,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/** Claves de búsqueda derivadas de los términos que devolvió la IA. */
export function clavesDeIdentificacion(
  identificacion: IdentificacionVisual,
): string[] {
  return tokens(identificacion.terminos, 2);
}

export type Clasificacion = {
  nivel: NivelCoincidencia;
  caracteristicasCoincidentes: string[];
};

/**
 * Clasifica una oferta según cuántas claves de la identificación aparecen en el
 * texto del producto. No inventa precisión: los niveles son etiquetas
 * cualitativas y se acompañan de las características que realmente coinciden.
 */
export function clasificarOferta(
  oferta: OfertaPublica,
  claves: string[],
  caracteristicas: string[],
): Clasificacion {
  const texto = textoProducto(oferta);
  const presentes = claves.filter((k) => texto.includes(k));
  const ratio = claves.length === 0 ? 0 : presentes.length / claves.length;

  const nivel: NivelCoincidencia =
    claves.length > 0 && presentes.length === claves.length
      ? "alta"
      : ratio >= 0.5
        ? "probable"
        : "similar";

  // Características visibles cuyo texto (palabra significativa) aparece en el producto.
  const caracteristicasCoincidentes = caracteristicas.filter((c) =>
    tokens(c, 4).some((t) => texto.includes(t)),
  );

  return { nivel, caracteristicasCoincidentes };
}
