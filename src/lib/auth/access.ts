import { ROLES, type Role } from "./constants";

export type AccessDecision =
  | { ok: true; role: Role }
  | { ok: false; status: 401 | 403; error: string };

export const CATALOGO_ALLOWED_ROLES: readonly Role[] = [ROLES.ADMIN];

export const OFERTAS_ALLOWED_ROLES: readonly Role[] = [ROLES.COMERCIO];

export const ASISTENTE_ALLOWED_ROLES: readonly Role[] = [ROLES.CLIENTE];

export const COTIZACIONES_ALLOWED_ROLES: readonly Role[] = [ROLES.CLIENTE];

export function decideAccess(
  role: Role | undefined | null,
  allowed: readonly Role[],
): AccessDecision {
  if (!role) return { ok: false, status: 401, error: "No autenticado" };
  if (!allowed.includes(role)) {
    return { ok: false, status: 403, error: "No autorizado" };
  }
  return { ok: true, role };
}
