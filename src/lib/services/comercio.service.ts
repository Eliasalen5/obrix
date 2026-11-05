import { prisma } from "@/lib/prisma";

export type ComercioEstado = { id: string; activo: boolean };

export async function getComercioByOwner(
  userId: string,
): Promise<ComercioEstado | null> {
  const comercio = await prisma.comercio.findUnique({
    where: { ownerId: userId },
    select: { id: true, activo: true },
  });
  return comercio ?? null;
}
