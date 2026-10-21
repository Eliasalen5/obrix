import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";
import { ROLES, type Role } from "@/lib/auth/constants";
import type { SessionUser } from "@/lib/auth/sessionUser";
import { verifyCredentials } from "@/lib/auth/credentials";

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
        return verifyCredentials(credentials);
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
