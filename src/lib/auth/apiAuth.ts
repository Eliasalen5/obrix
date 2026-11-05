import { authOptions } from "./options";
import { getServerSession } from "next-auth";
import { resolveIdentity } from "./token";
import {
  decideAccess,
  ASISTENTE_ALLOWED_ROLES,
  CATALOGO_ALLOWED_ROLES,
  COTIZACIONES_ALLOWED_ROLES,
  OFERTAS_ALLOWED_ROLES,
} from "./access";
import type { Role } from "./constants";
import { getComercioByOwner } from "@/lib/services/comercio.service";

export type AdminAccess =
  | { ok: true; userId?: string; role: Role }
  | { ok: false; status: 401 | 403; error: string };

export type AuthenticatedAccess =
  | { ok: true; userId: string; role: Role }
  | { ok: false; status: 401 | 403; error: string };

export type ComercioAccess =
  | { ok: true; userId: string; role: Role; comercioId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Rol del usuario para UI que corre en el servidor (server components). Se lee
 * de la sesión con cookie; el Bearer es solo para la API móvil.
 */
export async function getSessionRole(): Promise<Role | undefined> {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: Role } | undefined)?.role;
}

async function requireAuthenticatedApi(
  allowed: readonly Role[],
): Promise<AuthenticatedAccess> {
  const identity = await resolveIdentity();

  const decision = decideAccess(identity?.role, allowed);
  if (!decision.ok) return decision;
  if (!identity?.userId) return { ok: false, status: 401, error: "No autenticado" };

  return { ok: true, userId: identity.userId, role: decision.role };
}

// El acceso admin valida solo el rol (contrato previo); userId queda opcional.
export async function requireAdminApi(): Promise<AdminAccess> {
  const identity = await resolveIdentity();

  const decision = decideAccess(identity?.role, CATALOGO_ALLOWED_ROLES);
  if (!decision.ok) return decision;

  return { ok: true, userId: identity?.userId, role: decision.role };
}

export async function requireComercioApi(): Promise<ComercioAccess> {
  const access = await requireAuthenticatedApi(OFERTAS_ALLOWED_ROLES);
  if (!access.ok) return access;

  const comercio = await getComercioByOwner(access.userId);

  if (!comercio) {
    return {
      ok: false,
      status: 403,
      error: "El usuario no tiene un comercio asociado",
    };
  }
  if (!comercio.activo) {
    return { ok: false, status: 403, error: "Comercio inactivo" };
  }

  return { ...access, comercioId: comercio.id };
}

export async function requireAsistenteApi(): Promise<AuthenticatedAccess> {
  return requireAuthenticatedApi(ASISTENTE_ALLOWED_ROLES);
}

export async function requireClienteApi(): Promise<AuthenticatedAccess> {
  return requireAuthenticatedApi(COTIZACIONES_ALLOWED_ROLES);
}
