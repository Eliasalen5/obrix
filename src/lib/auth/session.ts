import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import type { Role } from "./constants";
import { sessionRole } from "./sessionUser";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  const role = sessionRole(session);
  if (!session || !role || !roles.includes(role)) {
    return { ok: false as const, session: null };
  }
  return { ok: true as const, session };
}
