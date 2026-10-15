"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ROLES, type Role } from "@/lib/auth/constants";

type Enlace = { href: string; label: string };

const ENLACES: Record<Role, Enlace[]> = {
  [ROLES.CLIENTE]: [
    { href: "/cliente", label: "Mi panel" },
    { href: "/cliente/proyecto", label: "Nuevo proyecto" },
    { href: "/cliente/pedidos", label: "Mis pedidos" },
  ],
  [ROLES.COMERCIO]: [
    { href: "/comercio", label: "Panel" },
    { href: "/comercio/ofertas", label: "Mis ofertas" },
    { href: "/comercio/pedidos", label: "Pedidos" },
  ],
  [ROLES.ADMIN]: [
    { href: "/dashboard", label: "Panel" },
    { href: "/catalogo", label: "Catálogo" },
  ],
};

const ETIQUETA_ROL: Record<Role, string> = {
  [ROLES.CLIENTE]: "Cliente",
  [ROLES.COMERCIO]: "Comercio",
  [ROLES.ADMIN]: "Admin",
};

export default function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: Role } | undefined)?.role;
  const enlaces = role ? ENLACES[role] : [];

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Obrix
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {enlaces.map((enlace) => {
            const activo =
              pathname === enlace.href || pathname.startsWith(`${enlace.href}/`);
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                className={
                  activo
                    ? "font-medium text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }
              >
                {enlace.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {status === "loading" ? null : role ? (
            <>
              <span className="text-zinc-500 dark:text-zinc-400">
                {session?.user?.name ?? session?.user?.email} ·{" "}
                {ETIQUETA_ROL[role]}
              </span>
              <button
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/ingresar"
              className="rounded bg-zinc-900 px-3 py-1 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
