import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { ROLES, type Role } from "./constants";
import { prisma } from "@/lib/prisma";

export async function requireComercioSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: Role } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || role !== ROLES.COMERCIO || !userId) {
    redirect("/ingresar");
  }

  const comercio = await prisma.comercio.findUnique({
    where: { ownerId: userId },
    select: { activo: true },
  });

  if (!comercio || !comercio.activo) {
    redirect("/comercio/solicitud");
  }

  return session;
}
