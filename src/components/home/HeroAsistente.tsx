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
    <section className="bg-obrix-white text-obrix-black">
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-obrix-gray px-3 py-1 text-xs font-semibold uppercase tracking-wide text-obrix-black">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-obrix-orange"
            />
            Asistente IA para tu obra
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-obrix-black sm:text-6xl">
            Describí tu proyecto.{" "}
            <span className="inline-block bg-obrix-orange px-2 text-obrix-black">
              Obrix
            </span>{" "}
            te arma la lista de materiales.
          </h1>
          <p className="mt-5 text-lg text-neutral-600">
            El asistente calcula cantidades, cotiza en comercios cercanos y te
            deja armar el pedido. Todo desde un solo lugar.
          </p>

          <form onSubmit={onSubmit} className="mt-8 text-left">
            <div className="rounded-2xl border border-neutral-200 bg-obrix-white p-2 shadow-[0_24px_70px_-40px_rgba(23,23,23,0.45)] ring-1 ring-black/5 transition-colors focus-within:border-obrix-orange">
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
                className="w-full resize-none rounded-xl bg-transparent px-3 py-3 text-base text-obrix-black placeholder:text-neutral-400 focus:outline-none"
              />
              <div className="flex flex-col gap-2 border-t border-neutral-200 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p
                  id="hero-descripcion-ayuda"
                  className="text-xs text-neutral-500"
                >
                  Mínimo {DESCRIPCION_MIN} caracteres. Contá medidas y
                  materiales si los tenés.
                </p>
                <button
                  type="submit"
                  disabled={!valido}
                  className="rounded-full bg-obrix-orange px-5 py-2.5 font-semibold text-obrix-black transition-colors hover:bg-[#e85c00] disabled:cursor-not-allowed disabled:opacity-50"
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
              <span className="text-neutral-500">Ejemplos:</span>
              {EJEMPLOS.map((ejemplo) => (
                <button
                  key={ejemplo.label}
                  type="button"
                  onClick={() => {
                    setDescripcion(ejemplo.texto);
                    setError(null);
                  }}
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-obrix-black transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
                >
                  {ejemplo.label}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="#categorias"
              className="rounded-full bg-obrix-black px-6 py-2.5 font-medium text-obrix-white transition-colors hover:bg-neutral-800"
            >
              Ver categorías
            </Link>
          </div>
          <p className="mt-4 text-sm text-neutral-500">
            Precios congelados al confirmar tu pedido
          </p>
        </div>
      </div>
    </section>
  );
}
