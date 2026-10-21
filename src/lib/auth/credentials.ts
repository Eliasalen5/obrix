import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/services/auth.service";
import { loginRateLimiter } from "@/lib/rate-limit";
import type { Role } from "@/lib/auth/constants";

export type CredentialUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

/**
 * Valida email+password reutilizando Zod, el rate limit por email y bcrypt.
 * Devuelve el usuario o `null`. Es la única fuente de verdad del login por
 * credenciales: la usan tanto NextAuth (`authorize`) como `POST /api/v1/auth/token`.
 */
export async function verifyCredentials(
  credentials: unknown,
): Promise<CredentialUser | null> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  // Rate limit por email antes de tocar la DB/bcrypt (mitiga fuerza bruta).
  const limit = loginRateLimiter.check(`login:${parsed.data.email}`);
  if (!limit.allowed) return null;

  const { email, password } = parsed.data;
  const user = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, email: true, nombre: true, rol: true, passwordHash: true },
  });
  if (!user?.passwordHash) return null;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.nombre,
    role: user.rol as Role,
  };
}
