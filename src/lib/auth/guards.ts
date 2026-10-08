import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import type { Role } from "./constants";
import { ROLES } from "./constants";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as Role | undefined;
  if (!session || role !== ROLES.ADMIN) {
    redirect("/api/auth/signin");
  }
  return session;
}

export async function requireComercio() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as Role | undefined;
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
