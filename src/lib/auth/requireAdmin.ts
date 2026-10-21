import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { ROLES } from "./constants";
import { sessionRole } from "./sessionUser";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const role = sessionRole(session);
  if (!session || role !== ROLES.ADMIN) {
    redirect("/ingresar");
  }
  return session;
}
