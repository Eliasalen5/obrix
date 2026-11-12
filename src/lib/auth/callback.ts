export function resolverCallbackUrl(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}

export function agregarCallbackUrl(
  path: string,
  callbackUrl: string | null | undefined,
): string {
  const destino = resolverCallbackUrl(callbackUrl, "");
  if (!destino) return path;
  const separador = path.includes("?") ? "&" : "?";
  return `${path}${separador}callbackUrl=${encodeURIComponent(destino)}`;
}
