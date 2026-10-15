import { prisma } from "@/lib/prisma";

export async function getComercioIdByOwner(
  userId: string,
): Promise<string | null> {
  const comercio = await prisma.comercio.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });
  return comercio?.id ?? null;
}
