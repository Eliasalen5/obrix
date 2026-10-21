import type { Role } from "./constants";

export type SessionUser = {
  id?: string;
  role?: Role;
  name?: string | null;
  email?: string | null;
};

export type AppSession = {
  user?: SessionUser;
} | null;

/** Extrae el rol de la sesión de NextAuth sin recurrir a `any`. */
export function sessionRole(
  session: { user?: unknown } | null | undefined,
): Role | undefined {
  return (session?.user as SessionUser | undefined)?.role;
}

/** Extrae el usuario tipado de la sesión de NextAuth. */
export function sessionUser(
  session: { user?: unknown } | null | undefined,
): SessionUser | undefined {
  return session?.user as SessionUser | undefined;
}
