"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import OfertaCard from "@/app/ofertas/OfertaCard";
import { obtenerResultadoVision } from "@/lib/vision/resultado";
import type { VisionResponse } from "@/lib/validators/vision";

export default function ResultadoFoto() {
  const [resultado, setResultado] = useState<VisionResponse | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setResultado(obtenerResultadoVision());
    setCargado(true);
  }, []);

  if (!cargado) {
    return (
      <main className="flex-1 bg-obrix-white px-4 py-16 text-center text-neutral-500">
        Cargando identificación…
      </main>
    );
  }

  if (!resultado) {
    return (
      <main className="flex-1 bg-obrix-white px-4 py-16 text-obrix-black">
        <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-obrix-gray p-8 text-center">
          <h1 className="text-2xl font-bold">Todavía no analizaste una foto</h1>
          <p className="mt-3 text-neutral-600">
            Subí una fotografía desde el buscador inteligente para identificar
            un material y ver ofertas compatibles.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-obrix-orange px-5 py-2.5 font-semibold text-obrix-black"
          >
            Ir al buscador
          </Link>
        </div>
      </main>
    );
  }

  const { identificacion, ofertas } = resultado;
  const filtros = new URLSearchParams({ q: identificacion.terminos });
  if (identificacion.categoria) {
    filtros.set("categoria", identificacion.categoria);
  }

  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <span
          aria-hidden="true"
          className="mb-3 block h-1 w-12 rounded-full bg-obrix-orange"
        />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Identificación por fotografía
        </h1>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Objeto detectado
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {identificacion.objeto}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  identificacion.confianza === "confirmada"
                    ? "bg-green-100 text-green-900"
                    : "bg-obrix-orange/15 text-obrix-black"
                }`}
              >
                Identificación {identificacion.confianza}
              </span>
            </div>
            <p className="mt-2 text-neutral-600">{identificacion.tipo}</p>
            {identificacion.categoria && (
              <p className="mt-2 text-sm text-neutral-500">
                Categoría sugerida: {identificacion.categoria}
              </p>
            )}

            <h3 className="mt-5 font-semibold">Características visibles</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
              {identificacion.caracteristicas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-obrix-gray p-5">
            <h2 className="font-semibold">Qué falta confirmar</h2>
            <p className="mt-2 text-sm text-neutral-600">
              La foto orienta la búsqueda, pero no permite confirmar medidas,
              roscas, resistencia ni otras especificaciones técnicas.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-600">
              {identificacion.incertidumbres.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-neutral-500">
              Confirmá la compatibilidad con el comercio antes de comprar.
              {resultado.modo === "demo" &&
                " Esta identificación es simulada: el modo demo no analiza la imagen real."}
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Productos compatibles</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Búsqueda: “{identificacion.terminos}” · {ofertas.length}{" "}
              {ofertas.length === 1 ? "oferta" : "ofertas"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/ofertas?${filtros.toString()}`}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-obrix-orange"
            >
              Ver en ofertas
            </Link>
            <Link
              href="/"
              className="rounded-full bg-obrix-black px-4 py-2 text-sm font-medium text-obrix-white"
            >
              Analizar otra foto
            </Link>
          </div>
        </div>

        {ofertas.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ofertas.map((oferta) => (
              <OfertaCard
                key={oferta.id}
                productoNombre={oferta.productoNombre}
                marca={oferta.marca}
                presentacion={oferta.presentacion}
                unidad={oferta.unidad}
                precio={oferta.precio}
                categoria={oferta.categoria}
                comercioNombre={oferta.comercioNombre}
                comercioDireccion={oferta.comercioDireccion}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-obrix-gray p-6 text-center">
            <p className="font-semibold">
              No encontramos ofertas con esos términos
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Probá confirmar el nombre del producto con el comercio o buscalo en
              el catálogo general.
            </p>
            <Link
              href="/ofertas"
              className="mt-4 inline-block rounded-full bg-obrix-orange px-5 py-2.5 text-sm font-semibold text-obrix-black"
            >
              Ver todas las ofertas
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
