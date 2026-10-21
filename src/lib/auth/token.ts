import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import type { Role } from "./constants";

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
 * `getToken` de NextAuth ya busca primero en la cookie y luego en el header
 * Bearer, y valida la firma con el mismo `NEXTAUTH_SECRET`. Se respeta la
 * revocación: si el callback `jwt` marcó `token.invalid` (usuario eliminado),
 * se considera no autenticado.
 */
export async function resolveIdentity(): Promise<TokenIdentity | null> {
  const reqHeaders = await headers();
  const token = (await getToken({
    // `getToken` en runtime lee de un objeto con `headers` (cookie o Bearer);
    // sus tipos exigen NextRequest/NextApiRequest, de ahí el cast acotado.
    req: { headers: reqHeaders } as unknown as Parameters<typeof getToken>[0]["req"],
    secret: SECRET,
  })) as JwtPayload | null;

  if (!token || token.invalid) return null;
  if (!token.sub || !token.role) return null;

  return { userId: token.sub, role: token.role };
}
