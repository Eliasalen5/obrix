import { ROLES, type Role } from "@/lib/auth/constants";

const RUTAS_POR_ROL: Record<Role, readonly string[]> = {
  [ROLES.CLIENTE]: ["/cliente", "/comercio/solicitud"],
  [ROLES.COMERCIO]: ["/comercio"],
  [ROLES.ADMIN]: ["/dashboard"],
};

function coincideRuta(destino: string, base: string): boolean {
  return (
    destino === base ||
    destino.startsWith(`${base}/`) ||
    destino.startsWith(`${base}?`)
  );
}

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

export function esDestinoPermitidoPorRol(
  role: Role,
  callbackUrl: string | null | undefined,
): boolean {
  const destino = resolverCallbackUrl(callbackUrl, "");
  if (!destino) return false;
  return RUTAS_POR_ROL[role].some((base) => coincideRuta(destino, base));
}

export function mensajeContinuidad(
  callbackUrl: string | null | undefined,
): string | null {
  const destino = resolverCallbackUrl(callbackUrl, "");
  if (!destino) return null;

  if (coincideRuta(destino, "/cliente/proyecto")) {
    return "Ingresá para armar tu lista de materiales. Te vamos a devolver al asistente con tu proyecto.";
  }
  if (coincideRuta(destino, "/comercio/solicitud")) {
    return "Ingresá para ver el estado de tu solicitud de comercio.";
  }
  if (coincideRuta(destino, "/cliente/pedidos")) {
    return "Ingresá para ver tus pedidos.";
  }
  if (coincideRuta(destino, "/cliente")) {
    return "Ingresá para continuar con tu proyecto.";
  }
  if (coincideRuta(destino, "/comercio")) {
    return "Ingresá para gestionar tu comercio.";
  }
  if (coincideRuta(destino, "/dashboard")) {
    return "Ingresá para acceder al panel de administración.";
  }
  return null;
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
