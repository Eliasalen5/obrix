export const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** Disponibilidad legible a partir del stock publicado (Oferta.stock). */
export function disponibilidadTexto(stock: number): string {
  if (stock < 0) return "Consultar disponibilidad";
  if (stock === 0) return "Sin stock";
  return `${stock} disponible${stock === 1 ? "" : "s"}`;
}
