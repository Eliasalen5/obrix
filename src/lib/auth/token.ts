import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "./options";
import type { Role } from "./constants";
import type { SessionUser } from "./sessionUser";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.NEXTAUTH_SECRET;

export type TokenIdentity = {
  userId: string;
  role: Role;
};

type JwtPayload = {
  sub?: string;
  role?: Role;
  ver?: number;
  invalid?: boolean;
};

/**
 * Valida el token contra la base en cada uso: usuario existente y misma
 * `tokenVersion` (revocación global). El rol se toma de la DB, no del token,
 * para que una pérdida de rol tenga efecto inmediato.
 */
async function identityFromToken(
  token: JwtPayload | null,
): Promise<TokenIdentity | null> {
  if (!token || token.invalid || !token.sub) return null;

  const user = await prisma.usuario.findUnique({
    where: { id: token.sub },
    select: { id: true, rol: true, tokenVersion: true },
  });
  if (!user) return null;
  if (token.ver !== user.tokenVersion) return null;

  return { userId: user.id, role: user.rol as Role };
}

/**
 * Resuelve la identidad del request aceptando DOS formas de autenticación:
 * - Cookie de sesión de NextAuth (navegador / web).
 * - Header `Authorization: Bearer <jwt>` (app mobile).
 *
 * Primero intenta con getServerSession (más confiable en Vercel/serverless).
 * Si no hay sesión por cookie, intenta con getToken() para soportar Bearer.
 */
export async function resolveIdentity(): Promise<TokenIdentity | null> {
  // Intentar primero con getServerSession (funciona correctamente en Vercel)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const su = session.user as SessionUser;
      if (su.id && su.role) {
        return { userId: su.id, role: su.role };
      }
      // Si falta id/role en session.user, intentar con token.sub
      const reqHeaders = await headers();
      const token = (await getToken({
        req: { headers: reqHeaders } as unknown as Parameters<typeof getToken>[0]["req"],
        secret: SECRET,
      })) as JwtPayload | null;
      return identityFromToken(token);
    }
  } catch {
    // Continuar con getToken
  }

  // Fallback a getToken para Bearer tokens (app mobile)
  try {
    const reqHeaders = await headers();
    const token = (await getToken({
      req: { headers: reqHeaders } as unknown as Parameters<typeof getToken>[0]["req"],
      secret: SECRET,
    })) as JwtPayload | null;

    return identityFromToken(token);
  } catch {
    return null;
  }
}
