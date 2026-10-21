import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import {
  decideAccess,
  ASISTENTE_ALLOWED_ROLES,
  CATALOGO_ALLOWED_ROLES,
  COTIZACIONES_ALLOWED_ROLES,
  OFERTAS_ALLOWED_ROLES,
} from "./access";
import type { Role } from "./constants";

export type AdminAccess =
  | { ok: true; userId?: string; role: Role }
  | { ok: false; status: 401 | 403; error: string };

export type AuthenticatedAccess =
  | { ok: true; userId: string; role: Role }
  | { ok: false; status: 401 | 403; error: string };

export type ComercioAccess = AuthenticatedAccess;

export async function getSessionRole(): Promise<Role | undefined> {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: Role } | undefined)?.role;
}

async function requireAuthenticatedApi(
  allowed: readonly Role[],
): Promise<AuthenticatedAccess> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: Role } | undefined;

  const decision = decideAccess(user?.role, allowed);
  if (!decision.ok) return decision;
  if (!user?.id) return { ok: false, status: 401, error: "No autenticado" };

  return { ok: true, userId: user.id, role: decision.role };
}

// El acceso admin valida solo el rol (contrato previo); userId queda opcional.
export async function requireAdminApi(): Promise<AdminAccess> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: Role } | undefined;

  const decision = decideAccess(user?.role, CATALOGO_ALLOWED_ROLES);
  if (!decision.ok) return decision;

  return { ok: true, userId: user?.id, role: decision.role };
}

export async function requireComercioApi(): Promise<AuthenticatedAccess> {
  return requireAuthenticatedApi(OFERTAS_ALLOWED_ROLES);
}

export async function requireAsistenteApi(): Promise<AuthenticatedAccess> {
  return requireAuthenticatedApi(ASISTENTE_ALLOWED_ROLES);
}

export async function requireClienteApi(): Promise<AuthenticatedAccess> {
  return requireAuthenticatedApi(COTIZACIONES_ALLOWED_ROLES);
}
