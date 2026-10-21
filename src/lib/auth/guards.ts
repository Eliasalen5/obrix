import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { ROLES } from "./constants";
import { sessionRole } from "./sessionUser";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = sessionRole(session);
  if (!session || role !== ROLES.ADMIN) {
    redirect("/api/auth/signin");
  }
  return session;
}

export async function requireComercio() {
  const session = await getServerSession(authOptions);
  const role = sessionRole(session);
  if (!session || role !== ROLES.COMERCIO) {
    redirect("/api/auth/signin");
  }
  return session;
}

export async function requireClienteOrAuth() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");
  return session;
}
