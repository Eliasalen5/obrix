"use client";

import Link from "next/link";
import Image from "next/image";

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
    img: "/herramientas.jpg",
  },
  {
    nombre: "Madereras y carpintería",
    slug: "madereras",
    img: "/ladrillos.jpg",
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
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 lg:grid-rows-2 lg:grid-flow-col">
        {CATEGORIAS.map((cat) => (
          <Link
            key={cat.slug}
            href="/cliente/proyecto"
            className="group relative overflow-hidden rounded-xl border border-zinc-200 transition-all hover:shadow-lg dark:border-zinc-800"
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
    </section>
  );
}
