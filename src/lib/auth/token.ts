import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "./options";
import type { Role } from "./constants";
import type { SessionUser } from "./sessionUser";

const SECRET = process.env.NEXTAUTH_SECRET;

export type TokenIdentity = {
  userId: string;
  role: Role;
};

type JwtPayload = {
  sub?: string;
  role?: Role;
  invalid?: boolean;
};

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
      if (token?.sub && token.role && !token.invalid) {
        return { userId: token.sub, role: token.role };
      }
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

    if (!token || token.invalid) return null;
    if (!token.sub || !token.role) return null;

    return { userId: token.sub, role: token.role };
  } catch {
    return null;
  }
}
