"use client";

import Link from "next/link";

export default function HeroAsistente() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Asistente IA para tu obra
        </p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Describí tu proyecto.{" "}
          <span className="text-zinc-500">Obrix te arma la lista de materiales.</span>
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          El asistente calcula cantidades, cotiza en comercios cercanos y te deja
          armar el pedido. Todo desde un solo lugar.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/cliente/proyecto"
            className="rounded-full bg-zinc-900 px-6 py-2.5 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Probar asistente IA
          </Link>
          <Link
            href="#categorias"
            className="rounded-full border border-zinc-300 px-6 py-2.5 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Ver categorías
          </Link>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          Precios congelados al confirmar tu pedido
        </p>
      </div>
    </section>
  );
}
