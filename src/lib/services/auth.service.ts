import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ROLES, type Role } from "@/lib/auth/constants";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createUser(params: {
  email: string;
  password: string;
  nombre: string;
  rol?: Role;
}) {
  const passwordHash = await hashPassword(params.password);
  return prisma.usuario.create({
    data: {
      email: params.email,
      passwordHash,
      nombre: params.nombre,
      rol: params.rol ?? ROLES.CLIENTE,
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      createdAt: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.usuario.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      passwordHash: true,
    },
  });
}

export async function hasAnyUser() {
  const count = await prisma.usuario.count();
  return count > 0;
}
