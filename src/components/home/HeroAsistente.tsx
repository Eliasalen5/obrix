"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
} from "@/lib/validators/asistente";
import { guardarProyectoPendiente } from "@/lib/proyecto/pendiente";

const EJEMPLOS = [
  {
    label: "Parrilla de 1,5 m",
    texto: "Quiero hacer una parrilla de 1,5 m con ladrillo y cemento.",
  },
  {
    label: "Baño completo",
    texto: "Necesito materiales para un baño completo con cerámicos.",
  },
  {
    label: "Pintar un living",
    texto: "Quiero pintar un living de 4 x 5 m con dos manos.",
  },
];

export default function HeroAsistente() {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const texto = descripcion.trim();
  const valido = texto.length >= DESCRIPCION_MIN;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valido) {
      setError(
        `Contanos un poco más sobre tu proyecto (mínimo ${DESCRIPCION_MIN} caracteres).`,
      );
      return;
    }
    guardarProyectoPendiente(texto, true);
    router.push("/cliente/proyecto");
  }

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

        <form onSubmit={onSubmit} className="mt-8 text-left">
          <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <label htmlFor="hero-descripcion" className="sr-only">
              Describí tu proyecto
            </label>
            <textarea
              id="hero-descripcion"
              rows={3}
              value={descripcion}
              onChange={(event) => {
                setDescripcion(event.target.value);
                if (error) setError(null);
              }}
              maxLength={DESCRIPCION_MAX}
              aria-describedby="hero-descripcion-ayuda"
              aria-invalid={Boolean(error)}
              placeholder="Ej: quiero hacer una parrilla de 1,5 m en el fondo, con ladrillo y cemento."
              className="w-full resize-none rounded-xl bg-transparent px-3 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="flex flex-col gap-2 border-t border-zinc-200 px-2 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <p
                id="hero-descripcion-ayuda"
                className="text-xs text-zinc-500"
              >
                Mínimo {DESCRIPCION_MIN} caracteres. Contá medidas y materiales
                si los tenés.
              </p>
              <button
                type="submit"
                disabled={!valido}
                className="rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Armar mi lista de materiales
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-zinc-500">Ejemplos:</span>
            {EJEMPLOS.map((ejemplo) => (
              <button
                key={ejemplo.label}
                type="button"
                onClick={() => {
                  setDescripcion(ejemplo.texto);
                  setError(null);
                }}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {ejemplo.label}
              </button>
            ))}
          </div>
        </form>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
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
