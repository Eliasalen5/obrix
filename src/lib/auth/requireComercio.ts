import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { ROLES, type Role } from "./constants";
import { prisma } from "@/lib/prisma";

export type ComercioSession = {
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
  comercio: { id: string; nombre: string; activo: boolean; plan: string };
};

export async function requireComercioSession(): Promise<ComercioSession> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: Role } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || role !== ROLES.COMERCIO || !userId) {
    redirect("/ingresar");
  }

  let comercio: ComercioSession["comercio"] | null = null;
  try {
    comercio = await prisma.comercio.findUnique({
      where: { ownerId: userId },
      select: { id: true, nombre: true, activo: true, plan: true },
    });
  } catch {
    // Compatibilidad si la DB aún no tiene la columna `plan` (migración pendiente).
    const base = await prisma.comercio.findUnique({
      where: { ownerId: userId },
      select: { id: true, nombre: true, activo: true },
    });
    comercio = base ? { ...base, plan: "INICIAL" } : null;
  }

  if (!comercio || !comercio.activo) {
    redirect("/comercio/solicitud");
  }

  return { session, comercio };
}
