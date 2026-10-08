import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { ROLES, type Role } from "./constants";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as Role | undefined;
  if (!session || role !== ROLES.ADMIN) {
    redirect("/api/auth/signin");
  }
  return session;
}
