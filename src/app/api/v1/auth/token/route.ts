import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/http";
import { verifyCredentials } from "@/lib/auth/credentials";
import { signSessionToken } from "@/lib/auth/signToken";

/**
 * Emite un JWT de sesión para la app mobile (auth por `Authorization: Bearer`).
 * Reutiliza el mismo login que la web (`verifyCredentials`: Zod + rate limit +
 * bcrypt). No crea sesión por cookie: la app guarda el token y lo envía en
 * cada request.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const user = await verifyCredentials(body);
  if (!user) {
    return jsonError(401, "Credenciales inválidas");
  }

  const { token, expiresIn } = await signSessionToken(user);

  return Response.json({
    data: {
      token,
      expiresIn,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    },
  });
}
