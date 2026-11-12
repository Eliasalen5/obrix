/** Minúsculas, sin acentos y con separación uniforme de palabras. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

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

/** Minúsculas, sin acentos, separa dígitos de letras y homologa unidades. */
export function normalizarClave(texto: string): string {
  // "m²" -> "m2" y homologa unidades ANTES de separar dígitos/letras,
  // para que unidades con dígito ("m2", "mm2", "mts2") no se partan.
  const pre = normalizarTexto(texto.replace(/²/g, "2"))
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

export type ProductoBusquedaInput = {
  sku?: string | null;
  nombre?: string | null;
  unidad?: string | null;
  descripcion?: string | null;
  marca?: string | null;
  fabricante?: string | null;
  codigoFabricante?: string | null;
  codigoBarras?: string | null;
};

/** Texto normalizado que se guarda en `Producto.busqueda`. */
export function construirBusquedaProducto(p: ProductoBusquedaInput): string {
  return normalizarClave(
    [
      p.nombre ?? "",
      p.sku ?? "",
      p.unidad ?? "",
      p.descripcion ?? "",
      p.marca ?? "",
      p.fabricante ?? "",
      p.codigoFabricante ?? "",
      p.codigoBarras ?? "",
    ]
      .filter(Boolean)
      .join(" "),
  );
}
