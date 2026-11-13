"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ROLES, type Role } from "@/lib/auth/constants";
import { CATEGORIAS, LOCALIDADES } from "@/lib/catalogo/categorias";

const UBICACION_KEY = "obrix:ubicacion";

const PANEL_POR_ROL: Record<Role, string> = {
  [ROLES.CLIENTE]: "/cliente",
  [ROLES.COMERCIO]: "/comercio",
  [ROLES.ADMIN]: "/dashboard",
};

const ETIQUETA_ROL: Record<Role, string> = {
  [ROLES.CLIENTE]: "Cliente",
  [ROLES.COMERCIO]: "Comercio",
  [ROLES.ADMIN]: "Admin",
};

function enlacesDeCuenta(role?: Role) {
  if (role === ROLES.CLIENTE) {
    return [
      { href: "/cliente", label: "Mi panel" },
      { href: "/cliente/proyecto", label: "Nuevo proyecto" },
      { href: "/cliente/pedidos", label: "Mis pedidos" },
    ];
  }
  if (role === ROLES.COMERCIO) {
    return [
      { href: "/comercio", label: "Panel de comercio" },
      { href: "/comercio/ofertas", label: "Mis ofertas" },
      { href: "/comercio/pedidos", label: "Pedidos recibidos" },
    ];
  }
  if (role === ROLES.ADMIN) {
    return [
      { href: "/dashboard", label: "Panel" },
      { href: "/catalogo", label: "Catálogo maestro" },
      { href: "/solicitudes", label: "Solicitudes" },
    ];
  }
  return [];
}

function linkCategoria(nombre: string) {
  return `/ofertas?categoria=${encodeURIComponent(nombre)}`;
}

function linkBusqueda(texto: string) {
  return `/ofertas?q=${encodeURIComponent(texto)}`;
}

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: Role } | undefined)?.role;

  const [categoriasOpen, setCategoriasOpen] = useState(false);
  const [cuentaOpen, setCuentaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busquedaOpen, setBusquedaOpen] = useState(false);
  const [ubicacion, setUbicacion] = useState("");
  const [consulta, setConsulta] = useState("");

  const categoriasRef = useRef<HTMLDivElement>(null);
  const cuentaRef = useRef<HTMLDivElement>(null);

  const enlacesCuenta = enlacesDeCuenta(role);
  const nombreCuenta =
    session?.user?.name?.split(" ")[0] || (role ? "Mi cuenta" : "Ingresar");

  useEffect(() => {
    const guardada = window.localStorage.getItem(UBICACION_KEY);
    if (guardada) setUbicacion(guardada);
  }, []);

  useEffect(() => {
    setCategoriasOpen(false);
    setCuentaOpen(false);
    setMenuOpen(false);
    setBusquedaOpen(false);
  }, [pathname]);

  useEffect(() => {
    function alHacerClic(event: MouseEvent) {
      const target = event.target as Node;
      if (
        categoriasRef.current &&
        !categoriasRef.current.contains(target)
      ) {
        setCategoriasOpen(false);
      }
      if (cuentaRef.current && !cuentaRef.current.contains(target)) {
        setCuentaOpen(false);
      }
    }
    function alPresionarTecla(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCategoriasOpen(false);
        setCuentaOpen(false);
        setMenuOpen(false);
        setBusquedaOpen(false);
      }
    }
    document.addEventListener("mousedown", alHacerClic);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alHacerClic);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, []);

  function cambiarUbicacion(valor: string) {
    setUbicacion(valor);
    window.localStorage.setItem(UBICACION_KEY, valor);
  }

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const texto = consulta.trim();
    setBusquedaOpen(false);
    setMenuOpen(false);
    router.push(texto ? linkBusqueda(texto) : "/ofertas");
  }

  function abrirBusqueda() {
    setMenuOpen(false);
    setBusquedaOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const esActivo = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const enlaceClase = (href: string) =>
    `flex h-16 items-center border-b-2 text-sm transition-colors ${
      esActivo(href)
        ? "border-obrix-orange font-semibold text-obrix-black"
        : "border-transparent text-neutral-600 hover:text-obrix-black"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-obrix-white/95 text-obrix-black backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Obrix, ir al inicio">
            <Image
              src="/logo-obrix.webp"
              alt="Obrix"
              width={128}
              height={128}
              priority
              className="h-10 w-10 rounded-xl object-cover"
            />
            <span className="ml-2 hidden text-lg font-bold tracking-tight sm:block">
              Obrix
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegación principal">
            <Link href="/" className={enlaceClase("/")}>
              Inicio
            </Link>

            <div ref={categoriasRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setCategoriasOpen((open) => !open);
                  setCuentaOpen(false);
                }}
                aria-expanded={categoriasOpen}
                aria-haspopup="true"
                aria-controls="menu-categorias"
                className={`flex h-16 items-center gap-1 border-b-2 text-sm transition-colors ${
                  categoriasOpen
                    ? "border-obrix-orange font-semibold text-obrix-black"
                    : "border-transparent text-neutral-600 hover:text-obrix-black"
                }`}
              >
                Categorías
                <Icon className="h-4 w-4">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </Icon>
              </button>

              {categoriasOpen && (
                <div
                  id="menu-categorias"
                  className="absolute left-0 top-full mt-2 w-[640px] rounded-2xl border border-neutral-200 bg-obrix-white p-4 shadow-2xl"
                >
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIAS.map((categoria) => (
                      <div
                        key={categoria.slug}
                        className="rounded-xl p-3 transition-colors hover:bg-obrix-gray"
                      >
                        <Link
                          href={linkCategoria(categoria.nombre)}
                          className="block text-sm font-semibold text-obrix-black hover:underline"
                        >
                          {categoria.nombre}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                          {categoria.subcategorias.map((subcategoria) => (
                            <Link
                              key={subcategoria}
                              href={linkBusqueda(subcategoria)}
                              className="text-xs text-neutral-500 transition-colors hover:text-obrix-orange"
                            >
                              {subcategoria}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
                    <p className="text-xs text-neutral-500">
                      Elegí un rubro para ver ofertas cercanas
                    </p>
                    <Link
                      href="/ofertas"
                      className="text-sm font-semibold text-obrix-black hover:text-obrix-orange"
                    >
                      Ver todas las ofertas
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/comercios" className={enlaceClase("/comercios")}>
              Comercios
            </Link>
            <Link href="/ofertas" className={enlaceClase("/ofertas")}>
              Ofertas
            </Link>
          </nav>

          <form
            role="search"
            onSubmit={buscar}
            className="relative ml-auto hidden w-48 lg:block xl:w-64"
          >
            <label htmlFor="buscador-header" className="sr-only">
              Buscar productos
            </label>
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </Icon>
            <input
              id="buscador-header"
              type="search"
              value={consulta}
              onChange={(event) => setConsulta(event.target.value)}
              placeholder="Buscar materiales…"
              className="w-full rounded-full border border-neutral-300 bg-obrix-gray py-2 pl-9 pr-3 text-sm text-obrix-black placeholder:text-neutral-500 focus:border-obrix-orange focus:bg-obrix-white focus:outline-none"
            />
          </form>

          <div className="hidden items-center gap-2 lg:flex">
            <label htmlFor="ubicacion-header" className="sr-only">
              Ubicación
            </label>
            <div className="flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5">
              <Icon className="h-4 w-4 text-obrix-orange">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 13a3 3 0 100-6 3 3 0 000 6z"
                />
              </Icon>
              <select
                id="ubicacion-header"
                value={ubicacion}
                onChange={(event) => cambiarUbicacion(event.target.value)}
                className="max-w-[8.5rem] bg-transparent text-sm text-obrix-black focus:outline-none"
              >
                <option value="">Elegí tu zona</option>
                {LOCALIDADES.map((localidad) => (
                  <option key={localidad} value={localidad}>
                    {localidad}
                  </option>
                ))}
              </select>
            </div>

            {role === ROLES.CLIENTE && (
              <Link
                href="/cliente/proyecto"
                aria-label="Armar pedido"
                title="Armar pedido"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-obrix-black transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
              >
                <Icon>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l2.4 11.2a2 2 0 002 1.6h8.7a2 2 0 002-1.6L22 7H6"
                  />
                  <circle cx="10" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                </Icon>
              </Link>
            )}

            <div ref={cuentaRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setCuentaOpen((open) => !open);
                  setCategoriasOpen(false);
                }}
                aria-expanded={cuentaOpen}
                aria-haspopup="true"
                aria-controls="menu-cuenta"
                className="flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
              >
                <Icon className="h-4 w-4">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 21a8 8 0 10-16 0"
                  />
                  <circle cx="12" cy="7" r="4" />
                </Icon>
                {status === "loading" ? "…" : nombreCuenta}
              </button>

              {cuentaOpen && (
                <div
                  id="menu-cuenta"
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-neutral-200 bg-obrix-white p-2 shadow-2xl"
                >
                  {role ? (
                    <>
                      <div className="border-b border-neutral-200 px-3 py-2">
                        <p className="truncate text-sm font-semibold">
                          {session?.user?.name ?? session?.user?.email}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {ETIQUETA_ROL[role]}
                        </p>
                      </div>
                      <nav className="mt-1">
                        {enlacesCuenta.map((enlace) => (
                          <Link
                            key={enlace.href}
                            href={enlace.href}
                            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-obrix-gray hover:text-obrix-black"
                          >
                            {enlace.label}
                          </Link>
                        ))}
                      </nav>
                      <button
                        type="button"
                        onClick={() => void signOut({ callbackUrl: "/" })}
                        className="mt-1 w-full rounded-lg border-t border-neutral-200 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <nav className="grid gap-1">
                      <Link
                        href="/ingresar"
                        className="rounded-lg bg-obrix-orange px-3 py-2 text-sm font-semibold text-obrix-black transition-colors hover:bg-[#e85c00]"
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/registro/cliente"
                        className="rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-obrix-gray hover:text-obrix-black"
                      >
                        Crear cuenta cliente
                      </Link>
                      <Link
                        href="/registro/comercio"
                        className="rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-obrix-gray hover:text-obrix-black"
                      >
                        Sumar mi comercio
                      </Link>
                    </nav>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => setBusquedaOpen((open) => !open)}
              aria-label="Buscar"
              aria-expanded={busquedaOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full text-obrix-black transition-colors hover:bg-obrix-gray"
            >
              <Icon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                />
              </Icon>
            </button>
            <Link
              href={role ? PANEL_POR_ROL[role] : "/ingresar"}
              aria-label={role ? "Mi cuenta" : "Iniciar sesión"}
              className="flex h-10 w-10 items-center justify-center rounded-full text-obrix-black transition-colors hover:bg-obrix-gray"
            >
              <Icon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 21a8 8 0 10-16 0"
                />
                <circle cx="12" cy="7" r="4" />
              </Icon>
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen((open) => !open);
                setBusquedaOpen(false);
              }}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              className="flex h-10 w-10 items-center justify-center rounded-full text-obrix-black transition-colors hover:bg-obrix-gray"
            >
              <Icon>
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6l-12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M4 12h16M4 17h16"
                  />
                )}
              </Icon>
            </button>
          </div>
        </div>

        {busquedaOpen && (
          <div className="border-t border-neutral-200 bg-obrix-white lg:hidden">
            <form
              role="search"
              onSubmit={buscar}
              className="mx-auto flex max-w-7xl gap-2 px-4 py-3"
            >
              <div className="relative flex-1">
                <label htmlFor="buscador-movil" className="sr-only">
                  Buscar productos
                </label>
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                  />
                </Icon>
                <input
                  id="buscador-movil"
                  type="search"
                  autoFocus
                  value={consulta}
                  onChange={(event) => setConsulta(event.target.value)}
                  placeholder="Buscar materiales…"
                  className="w-full rounded-full border border-neutral-300 bg-obrix-gray py-2 pl-9 pr-3 text-sm text-obrix-black placeholder:text-neutral-500 focus:border-obrix-orange focus:bg-obrix-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-obrix-orange px-4 py-2 text-sm font-semibold text-obrix-black transition-colors hover:bg-[#e85c00]"
              >
                Buscar
              </button>
            </form>
          </div>
        )}

        {menuOpen && (
          <div
            id="menu-movil"
            className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-neutral-200 bg-obrix-white lg:hidden"
          >
            <nav
              className="mx-auto max-w-7xl space-y-5 px-4 py-4"
              aria-label="Menú móvil"
            >
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/"
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-center text-sm font-medium hover:border-obrix-orange hover:bg-obrix-gray"
                >
                  Inicio
                </Link>
                <Link
                  href="/comercios"
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-center text-sm font-medium hover:border-obrix-orange hover:bg-obrix-gray"
                >
                  Comercios
                </Link>
                <Link
                  href="/ofertas"
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-center text-sm font-medium hover:border-obrix-orange hover:bg-obrix-gray"
                >
                  Ofertas
                </Link>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Categorías
                </p>
                <div className="mt-2 grid gap-1.5">
                  {CATEGORIAS.map((categoria) => (
                    <details
                      key={categoria.slug}
                      className="rounded-xl border border-neutral-200"
                    >
                      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                        {categoria.nombre}
                      </summary>
                      <div className="px-3 pb-2">
                        <div className="flex flex-wrap gap-2">
                          {categoria.subcategorias.map((subcategoria) => (
                            <Link
                              key={subcategoria}
                              href={linkBusqueda(subcategoria)}
                              className="rounded-full bg-obrix-gray px-2 py-1 text-xs text-neutral-700 hover:text-obrix-black"
                            >
                              {subcategoria}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="ubicacion-movil"
                  className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
                >
                  Ubicación
                </label>
                <select
                  id="ubicacion-movil"
                  value={ubicacion}
                  onChange={(event) => cambiarUbicacion(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-obrix-white px-3 py-2 text-sm focus:border-obrix-orange focus:outline-none"
                >
                  <option value="">Elegí tu zona</option>
                  {LOCALIDADES.map((localidad) => (
                    <option key={localidad} value={localidad}>
                      {localidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-neutral-200 pt-3">
                {role ? (
                  <div className="grid gap-1">
                    {enlacesCuenta.map((enlace) => (
                      <Link
                        key={enlace.href}
                        href={enlace.href}
                        className="rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-obrix-gray hover:text-obrix-black"
                      >
                        {enlace.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => void signOut({ callbackUrl: "/" })}
                      className="rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Link
                      href="/ingresar"
                      className="rounded-full bg-obrix-orange px-4 py-2 text-center text-sm font-semibold text-obrix-black"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/registro/cliente"
                      className="rounded-full border border-neutral-300 px-4 py-2 text-center text-sm font-medium"
                    >
                      Crear cuenta cliente
                    </Link>
                    <Link
                      href="/registro/comercio"
                      className="rounded-full border border-neutral-300 px-4 py-2 text-center text-sm font-medium"
                    >
                      Sumar mi comercio
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <nav
        aria-label="Navegación principal móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-obrix-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="grid grid-cols-5">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              esActivo("/") ? "font-semibold text-obrix-black" : "text-neutral-500"
            }`}
          >
            <Icon className="h-5 w-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5"
              />
            </Icon>
            Inicio
          </Link>
          <Link
            href="/#categorias"
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-neutral-500"
          >
            <Icon className="h-5 w-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
              />
            </Icon>
            Categorías
          </Link>
          <button
            type="button"
            onClick={abrirBusqueda}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              busquedaOpen ? "font-semibold text-obrix-black" : "text-neutral-500"
            }`}
          >
            <Icon className="h-5 w-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </Icon>
            Buscar
          </button>
          <Link
            href="/cliente/proyecto"
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-neutral-500"
          >
            <Icon className="h-5 w-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM18 16l.9 2.1L21 19l-2.1.9L18 22l-.9-2.1L15 19l2.1-.9L18 16z"
              />
            </Icon>
            IA
          </Link>
          <Link
            href={role ? PANEL_POR_ROL[role] : "/ingresar"}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-neutral-500"
          >
            <Icon className="h-5 w-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 21a8 8 0 10-16 0"
              />
              <circle cx="12" cy="7" r="4" />
            </Icon>
            Cuenta
          </Link>
        </div>
      </nav>
    </>
  );
}
