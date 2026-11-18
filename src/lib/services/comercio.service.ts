import { prisma } from "@/lib/prisma";
import type { UpdatePerfilComercioInput } from "@/lib/validators/comercio";

export type ComercioEstado = { id: string; activo: boolean };

export type PerfilComercio = {
  id: string;
  nombre: string;
  direccion: string;
  localidad: string;
  provincia: string;
  telefono: string;
  lat: number;
  lng: number;
  activo: boolean;
};

const PERFIL_SELECT = {
  id: true,
  nombre: true,
  direccion: true,
  localidad: true,
  provincia: true,
  telefono: true,
  lat: true,
  lng: true,
  activo: true,
} as const;

export async function getComercioByOwner(
  userId: string,
): Promise<ComercioEstado | null> {
  const comercio = await prisma.comercio.findUnique({
    where: { ownerId: userId },
    select: { id: true, activo: true },
  });
  return comercio ?? null;
}

export async function getPerfilComercio(
  comercioId: string,
): Promise<PerfilComercio | null> {
  return prisma.comercio.findUnique({
    where: { id: comercioId },
    select: PERFIL_SELECT,
  });
}

export async function updatePerfilComercio(
  comercioId: string,
  data: UpdatePerfilComercioInput,
): Promise<PerfilComercio> {
  return prisma.comercio.update({
    where: { id: comercioId },
    data: {
      nombre: data.nombre,
      direccion: data.direccion,
      localidad: data.localidad ?? "",
      provincia: data.provincia ?? "",
      telefono: data.telefono ?? "",
      lat: data.lat,
      lng: data.lng,
    },
    select: PERFIL_SELECT,
  });
}
