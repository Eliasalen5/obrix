import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { ROLES, type Role } from "./constants";

export async function requireComercioSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!session || role !== ROLES.COMERCIO) {
    redirect("/ingresar");
  }
  return session;
}
