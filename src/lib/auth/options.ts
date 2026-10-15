import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/services/auth.service";
import { ROLES, type Role } from "@/lib/auth/constants";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
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
        token.role = (user as any).role ?? ROLES.CLIENTE;
        token.name = user.name;
        token.email = user.email;
      } else {
        // refresh role from db if missing
        if (token.email) {
          const u = await prisma.usuario.findUnique({
            where: { email: token.email },
            select: { rol: true, nombre: true },
          });
          if (u) {
            token.role = u.rol as Role;
            token.name = token.name ?? u.nombre;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role as Role;
        session.user.name = token.name as string | undefined;
      }
      return session;
    },
  },
  pages: { signIn: "/ingresar" },
  secret: process.env.NEXTAUTH_SECRET,
};
