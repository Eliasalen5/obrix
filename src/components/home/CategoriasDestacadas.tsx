"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { guardarProyectoPendiente } from "@/lib/proyecto/pendiente";
import { CATEGORIAS } from "@/lib/catalogo/categorias";

export default function CategoriasDestacadas() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const mitad = Math.ceil(CATEGORIAS.length / 2);
  const firstRow = CATEGORIAS.slice(0, mitad);
  const secondRow = CATEGORIAS.slice(mitad);

  return (
    <section
      id="categorias"
      className="bg-obrix-white text-obrix-black"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <div>
            <span
              aria-hidden="true"
              className="mb-3 block h-1 w-12 rounded-full bg-obrix-orange"
            />
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Categorías
            </h2>
            <p className="mt-2 text-neutral-600">
              Encontrá lo que necesitás por rubro
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => scroll("left")}
              className="rounded-full border border-neutral-300 p-2 text-obrix-black transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
              aria-label="Anterior"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="rounded-full border border-neutral-300 p-2 text-obrix-black transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
              aria-label="Siguiente"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="mt-6 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex flex-col gap-3" style={{ minWidth: "max-content" }}>
          <div className="flex gap-3">
            {firstRow.map((cat) => (
              <Link
                key={cat.slug}
                href="/cliente/proyecto"
                onClick={() =>
                  guardarProyectoPendiente(
                    `Quiero comprar materiales de ${cat.nombre}.`,
                    false,
                  )
                }
                className="group relative w-[200px] flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 transition-all hover:border-obrix-orange hover:shadow-lg sm:w-[220px] lg:w-[240px]"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={cat.img}
                    alt={cat.nombre}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <span
                    aria-hidden="true"
                    className="mb-1 block h-0.5 w-6 bg-obrix-orange"
                  />
                  <h3 className="text-xs font-medium leading-tight text-white drop-shadow-sm sm:text-sm">
                    {cat.nombre}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex gap-3">
            {secondRow.map((cat) => (
              <Link
                key={cat.slug}
                href="/cliente/proyecto"
                onClick={() =>
                  guardarProyectoPendiente(
                    `Quiero comprar materiales de ${cat.nombre}.`,
                    false,
                  )
                }
                className="group relative w-[200px] flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 transition-all hover:border-obrix-orange hover:shadow-lg sm:w-[220px] lg:w-[240px]"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={cat.img}
                    alt={cat.nombre}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <span
                    aria-hidden="true"
                    className="mb-1 block h-0.5 w-6 bg-obrix-orange"
                  />
                  <h3 className="text-xs font-medium leading-tight text-white drop-shadow-sm sm:text-sm">
                    {cat.nombre}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
