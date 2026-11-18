"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Badge } from "@/components/ui";
import { getPlan } from "@/lib/planes";
import { cn } from "@/lib/ui/cn";

type IconName =
  | "home"
  | "box"
  | "orders"
  | "users"
  | "tag"
  | "chart"
  | "sparkles"
  | "store"
  | "file"
  | "card"
  | "user"
  | "menu"
  | "close"
  | "logout"
  | "external";

const ICONS: Record<IconName, ReactNode> = {
  home: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5" />,
  box: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 5 9-5M12 13v9" />
    </>
  ),
  orders: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l1 3H7l1-3zM6 6h12v15H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6M9 15h4" />
    </>
  ),
  users: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 20a4 4 0 00-8 0" />
      <circle cx="12" cy="9" r="3.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 19a3 3 0 00-2.5-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19a3 3 0 012.5-3" />
    </>
  ),
  tag: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12V5a2 2 0 012-2h7l9 9-9 9-9-9z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  chart: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16v-5M12 16V8M16 16v-3" />
    </>
  ),
  sparkles: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM18 16l.9 2.1L21 19l-2.1.9L18 22l-.9-2.1L15 19l2.1-.9L18 16z"
    />
  ),
  store: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16v11H4zM4 9l1.5-5h13L20 9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20v-6h6v6" />
    </>
  ),
  file: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h7l5 5v13H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h4" />
    </>
  ),
  user: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  menu: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />,
  close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />,
  logout: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12H4m0 0l3.5-3.5M4 12l3.5 3.5M11 4h6a2 2 0 012 2v12a2 2 0 01-2 2h-6"
    />
  ),
  external: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"
    />
  ),
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  soon?: boolean;
};

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [
      { href: "/comercio", label: "Resumen", icon: "home" },
      { href: "/comercio/ofertas", label: "Productos", icon: "box" },
      { href: "/comercio/pedidos", label: "Pedidos", icon: "orders" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { href: "/comercio/clientes", label: "Clientes", icon: "users", soon: true },
      { href: "/comercio/promociones", label: "Promociones", icon: "tag", soon: true },
      { href: "/comercio/estadisticas", label: "Analítica", icon: "chart", soon: true },
    ],
  },
  {
    label: "Profesional",
    items: [
      { href: "/comercio/asistente", label: "Asistente IA", icon: "sparkles", soon: true },
      { href: "/comercio/sucursales", label: "Sucursales", icon: "store", soon: true },
      { href: "/comercio/reportes", label: "Reportes", icon: "file", soon: true },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/comercio/perfil", label: "Perfil comercial", icon: "user" },
      { href: "/comercio/plan", label: "Plan y facturación", icon: "card", soon: true },
    ],
  },
];

function esActivo(pathname: string, href: string): boolean {
  if (href === "/comercio") return pathname === "/comercio";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label="Navegación del comercio">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {section.label}
          </p>
          <ul className="mt-2 space-y-0.5">
            {section.items.map((item) => {
              const active = esActivo(pathname, item.href);
              if (item.soon) {
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      disabled
                      title="Próximamente"
                      className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-500 opacity-70"
                    >
                      <Icon name={item.icon} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-400">
                        Pronto
                      </span>
                    </button>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-white/10 font-semibold text-obrix-white"
                        : "text-neutral-300 hover:bg-white/5 hover:text-obrix-white",
                    )}
                  >
                    <span
                      className={cn(
                        active ? "text-obrix-orange" : "text-neutral-400",
                      )}
                    >
                      <Icon name={item.icon} />
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({
  pathname,
  comercioNombre,
  planId,
  onNavigate,
}: {
  pathname: string;
  comercioNombre: string;
  planId: string;
  onNavigate?: () => void;
}) {
  const plan = getPlan(planId);
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Link
        href="/comercio"
        onClick={onNavigate}
        className="flex items-center gap-3 px-2"
        aria-label="Obrix, panel del comercio"
      >
        <Image
          src="/logo.jpg"
          alt=""
          width={72}
          height={40}
          className="h-9 w-auto rounded-lg object-contain"
        />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-obrix-white">Obrix</span>
          <span className="text-[11px] text-neutral-400">Panel del comercio</span>
        </span>
      </Link>

      <NavList pathname={pathname} onNavigate={onNavigate} />

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-obrix-white">{plan.nombre}</p>
          <span className="rounded-full bg-obrix-orange/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-obrix-orange">
            Actual
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
          {comercioNombre}
        </p>
        <p className="mt-1 text-[11px] text-neutral-400">
          Comisión {plan.comisionPct}% ·{" "}
          {plan.limiteProductos === null
            ? "Productos ilimitados"
            : `${plan.limiteProductos} productos`}
        </p>
        <button
          type="button"
          disabled
          title="Próximamente"
          className="mt-3 w-full cursor-not-allowed rounded-lg bg-obrix-orange/40 px-3 py-1.5 text-xs font-semibold text-obrix-black"
        >
          Mejorar plan (pronto)
        </button>
      </div>
    </div>
  );
}

export default function CommerceShell({
  comercioNombre,
  planId,
  children,
}: {
  comercioNombre: string;
  planId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const plan = getPlan(planId);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const nombre = session?.user?.name ?? "Mi cuenta";
  const email = session?.user?.email ?? "";
  const inicial = (nombre.trim()[0] ?? "C").toUpperCase();

  return (
    <div className="min-h-screen bg-obrix-gray text-obrix-black">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-obrix-black lg:block">
        <SidebarContent
          pathname={pathname}
          comercioNombre={comercioNombre}
          planId={planId}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-obrix-black">
            <SidebarContent
              pathname={pathname}
              comercioNombre={comercioNombre}
              planId={planId}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-obrix-gray hover:text-obrix-black lg:hidden"
          >
            <Icon name="menu" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-obrix-black">
              {comercioNombre}
            </p>
            <p className="hidden text-xs text-neutral-500 sm:block">
              Panel del comercio
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge tone="orange" className="hidden sm:inline-flex">
              {plan.nombre}
            </Badge>

            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-expanded={accountOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-full border border-neutral-200 py-1 pl-1 pr-3 transition-colors hover:border-neutral-300 hover:bg-obrix-gray"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-obrix-black text-xs font-semibold text-obrix-white">
                  {inicial}
                </span>
                <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:block">
                  {nombre}
                </span>
              </button>

              {accountOpen ? (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
                  <div className="border-b border-neutral-200 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-obrix-black">
                      {nombre}
                    </p>
                    {email ? (
                      <p className="truncate text-xs text-neutral-500">{email}</p>
                    ) : null}
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/comercio/perfil"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-obrix-gray hover:text-obrix-black"
                    >
                      <Icon name="user" className="h-4 w-4" />
                      Perfil comercial
                    </Link>
                    <Link
                      href="/"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-obrix-gray hover:text-obrix-black"
                    >
                      <Icon name="external" className="h-4 w-4" />
                      Ver sitio público
                    </Link>
                    <button
                      type="button"
                      onClick={() => void signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Icon name="logout" className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
