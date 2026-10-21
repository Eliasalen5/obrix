import { encode } from "next-auth/jwt";
import type { CredentialUser } from "@/lib/auth/credentials";

const SECRET = process.env.NEXTAUTH_SECRET;
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 días, igual criterio que la cookie

export type SignedToken = {
  token: string;
  expiresIn: number;
};

/**
 * Firma un JWT de sesión con el mismo formato que NextAuth, para que la app
 * mobile lo use como `Authorization: Bearer <token>`. Al compartir firma y
 * payload, el servidor valida cookie y Bearer con el mismo código.
 */
export async function signSessionToken(user: CredentialUser): Promise<SignedToken> {
  const token = await encode({
    secret: SECRET as string,
    maxAge: MAX_AGE_SECONDS,
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  return { token, expiresIn: MAX_AGE_SECONDS };
}
