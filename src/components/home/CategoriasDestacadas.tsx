"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";

const CATEGORIAS = [
  {
    nombre: "Ferreterías",
    slug: "ferreterias",
    img: "/ferreteria.jpg",
  },
  {
    nombre: "Corralones y materiales de construcción",
    slug: "corralones",
    img: "/corralones.png",
  },
  {
    nombre: "Pinturerías",
    slug: "pinturerias",
    img: "/pintura.jpg",
  },
  {
    nombre: "Casas de electricidad",
    slug: "electricidad",
    img: "/electricidad.webp",
  },
  {
    nombre: "Sanitarios, plomería y gas",
    slug: "sanitarios",
    img: "/sanitarios-plomeria.jpg",
  },
  {
    nombre: "Casas de pesca y náutica",
    slug: "pesca",
    img: "/pesca-nautica.jpg",
  },
  {
    nombre: "Madereras y carpintería",
    slug: "madereras",
    img: "/madera-carpinteria.jpg",
  },
  {
    nombre: "Jardinería, viveros y riego",
    slug: "jardineria",
    img: "/plomeria.jpg",
  },
  {
    nombre: "Cerámicas, pisos y revestimientos",
    slug: "ceramicas",
    img: "/ladrillos.jpg",
  },
  {
    nombre: "Techos y zinguería",
    slug: "techos",
    img: "/hierro.jpg",
  },
  {
    nombre: "Refrigeración y climatización",
    slug: "refrigeracion",
    img: "/electricidad.jpg",
  },
  {
    nombre: "Seguridad y cerrajería",
    slug: "seguridad",
    img: "/herramientas.jpg",
  },
  {
    nombre: "Piscinas",
    slug: "piscinas",
    img: "/plomeria.jpg",
  },
  {
    nombre: "Máquinas, herramientas y equipos",
    slug: "maquinas",
    img: "/herramientas.jpg",
  },
];

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

  const firstRow = CATEGORIAS.slice(0, 7);
  const secondRow = CATEGORIAS.slice(7, 14);

  return (
    <section id="categorias" className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Categorías
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Encontrá lo que necesitás por rubro
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scroll("left")}
            className="rounded-full border border-zinc-300 p-2 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
            className="rounded-full border border-zinc-300 p-2 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
                className="group relative w-[200px] flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 transition-all hover:shadow-lg dark:border-zinc-800 sm:w-[220px] lg:w-[240px]"
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
                className="group relative w-[200px] flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 transition-all hover:shadow-lg dark:border-zinc-800 sm:w-[220px] lg:w-[240px]"
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
