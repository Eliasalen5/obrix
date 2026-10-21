"use client";

import Link from "next/link";
import Image from "next/image";
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
    { href: "/solicitudes", label: "Solicitudes" },
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
    <header
      className="border-b border-white/10"
      style={{ backgroundColor: "#01162f" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-obrix.webp"
            alt="Obrix"
            width={128}
            height={128}
            priority
            className="h-14 w-auto"
          />
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
                    ? "font-medium text-white"
                    : "text-blue-200/80 hover:text-white"
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
              <span className="text-blue-200/80">
                {session?.user?.name ?? session?.user?.email} ·{" "}
                {ETIQUETA_ROL[role]}
              </span>
              <button
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="rounded border border-white/30 px-2 py-1 text-white hover:bg-white/10"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/ingresar"
              className="rounded bg-white px-3 py-1 text-[#01162f] hover:bg-blue-50"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
