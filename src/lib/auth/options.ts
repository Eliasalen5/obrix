import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/services/auth.service";
import { loginRateLimiter } from "@/lib/rate-limit";
import { ROLES, type Role } from "@/lib/auth/constants";
import type { SessionUser } from "@/lib/auth/sessionUser";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as unknown as Adapter),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as SessionUser).role ?? ROLES.CLIENTE;
        token.name = user.name;
        token.email = user.email;
      } else if (token.email) {
        // Revalida contra la DB en cada request: refresca rol/nombre y detecta
        // usuarios eliminados o desactivados para revocar su sesión activa.
        const u = await prisma.usuario.findUnique({
          where: { email: token.email },
          select: { rol: true, nombre: true },
        });
        if (!u) {
          token.invalid = true;
        } else {
          token.invalid = false;
          token.role = u.rol as Role;
          token.name = token.name ?? u.nombre;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Sesión revocada (usuario eliminado/desactivado): devolvemos una sesión
      // nula para que los guards (API y layout) corten el acceso.
      if (token.invalid) return null as unknown as typeof session;
      if (session.user) {
        const su = session.user as SessionUser;
        su.id = token.sub;
        su.role = token.role as Role;
        session.user.name = token.name as string | undefined;
      }
      return session;
    },
  },
  pages: { signIn: "/ingresar" },
  secret: process.env.NEXTAUTH_SECRET,
};
