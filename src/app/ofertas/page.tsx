import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/lib/catalogo/categorias";
import { normalizarClave } from "@/lib/text/busqueda";
import type { Prisma } from "@/generated/prisma/client";
import OfertaCard from "./OfertaCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofertas | Obrix",
  description:
    "Compará precios de materiales de construcción en comercios de tu zona.",
};

type Props = {
  searchParams: Promise<{
    q?: string | string[];
    categoria?: string | string[];
    comercioId?: string | string[];
  }>;
};

function primerValor(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
}

function hrefFiltros(filtros: {
  q?: string;
  categoria?: string;
  comercioId?: string;
}) {
  const params = new URLSearchParams();
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.comercioId) params.set("comercioId", filtros.comercioId);
  const query = params.toString();
  return query ? `/ofertas?${query}` : "/ofertas";
}

export default async function OfertasPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = primerValor(params.q).trim();
  const categoria = primerValor(params.categoria).trim();
  const comercioId = primerValor(params.comercioId).trim();

  const tokens = [...new Set(normalizarClave(q).split(" ").filter(Boolean))];

  const where: Prisma.OfertaWhereInput = {
    activo: true,
    comercio: { activo: true },
  };

  if (categoria) {
    where.producto = {
      categoria: { nombre: { equals: categoria, mode: "insensitive" } },
    };
  }
  if (comercioId) {
    where.comercioId = comercioId;
  }
  if (tokens.length > 0) {
    where.AND = tokens.map((token) => ({
      OR: [
        { producto: { busqueda: { contains: token } } },
        { producto: { nombre: { contains: token, mode: "insensitive" } } },
        { producto: { marca: { contains: token, mode: "insensitive" } } },
        { comercio: { nombre: { contains: token, mode: "insensitive" } } },
      ],
    }));
  }

  const ofertas = await prisma.oferta.findMany({
    where,
    include: {
      producto: { include: { categoria: true } },
      comercio: {
        select: { id: true, nombre: true, direccion: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });

  const hayFiltros = Boolean(q || categoria || comercioId);
  const titulo = q
    ? `Resultados para “${q}”`
    : categoria
      ? categoria
      : "Ofertas de materiales";

  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span
              aria-hidden="true"
              className="mb-3 block h-1 w-12 rounded-full bg-obrix-orange"
            />
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {titulo}
            </h1>
            <p className="mt-2 text-neutral-600">
              {ofertas.length}{" "}
              {ofertas.length === 1 ? "oferta disponible" : "ofertas disponibles"}
              {comercioId ? " en este comercio" : " en comercios activos"}
            </p>
          </div>
          {hayFiltros && (
            <Link
              href="/ofertas"
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
            >
              Limpiar filtros
            </Link>
          )}
        </div>

        <form
          action="/ofertas"
          role="search"
          className="mt-6 flex flex-col gap-2 sm:flex-row"
        >
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
          {comercioId && (
            <input type="hidden" name="comercioId" value={comercioId} />
          )}
          <label htmlFor="buscar-ofertas" className="sr-only">
            Buscar materiales
          </label>
          <input
            id="buscar-ofertas"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ej: cemento, pintura, hierro…"
            className="w-full rounded-full border border-neutral-300 bg-obrix-gray px-4 py-2.5 text-sm placeholder:text-neutral-500 focus:border-obrix-orange focus:bg-obrix-white focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-obrix-orange px-6 py-2.5 text-sm font-semibold text-obrix-black transition-colors hover:bg-[#e85c00]"
          >
            Buscar
          </button>
        </form>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link
            href={hrefFiltros({ q, comercioId })}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              !categoria
                ? "border-obrix-black bg-obrix-black text-obrix-white"
                : "border-neutral-300 text-neutral-700 hover:border-obrix-orange hover:bg-obrix-gray"
            }`}
          >
            Todos
          </Link>
          {CATEGORIAS.map((item) => {
            const activa =
              categoria.toLowerCase() === item.nombre.toLowerCase();
            return (
              <Link
                key={item.slug}
                href={hrefFiltros({ q, categoria: item.nombre, comercioId })}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activa
                    ? "border-obrix-black bg-obrix-black text-obrix-white"
                    : "border-neutral-300 text-neutral-700 hover:border-obrix-orange hover:bg-obrix-gray"
                }`}
              >
                {item.nombre}
              </Link>
            );
          })}
        </div>

        {ofertas.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-neutral-200 bg-obrix-gray p-8 text-center">
            <p className="text-lg font-semibold">Todavía no hay ofertas</p>
            <p className="mt-2 text-sm text-neutral-600">
              Probá con otra búsqueda o contanos tu proyecto para que el
              asistente arme la lista de materiales.
            </p>
            <Link
              href="/cliente/proyecto"
              className="mt-4 inline-block rounded-full bg-obrix-orange px-5 py-2.5 text-sm font-semibold text-obrix-black transition-colors hover:bg-[#e85c00]"
            >
              Armar mi lista con IA
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ofertas.map((oferta) => (
              <OfertaCard
                key={oferta.id}
                productoNombre={oferta.producto.nombre}
                marca={oferta.marca || oferta.producto.marca}
                presentacion={oferta.presentacion}
                unidad={oferta.producto.unidad}
                precio={oferta.precio}
                categoria={oferta.producto.categoria.nombre}
                comercioNombre={oferta.comercio.nombre}
                comercioDireccion={oferta.comercio.direccion}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
