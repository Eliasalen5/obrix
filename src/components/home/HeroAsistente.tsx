"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
} from "@/lib/validators/asistente";
import { CONSULTA_MAX, CONSULTA_MIN } from "@/lib/validators/busqueda";
import { guardarProyectoPendiente } from "@/lib/proyecto/pendiente";
import { busquedaIaApi } from "@/lib/api/busquedaIaClient";

type Modo = "escribir" | "foto" | "proyecto";

const MODOS: { id: Modo; label: string }[] = [
  { id: "escribir", label: "Escribir" },
  { id: "foto", label: "Fotografía" },
  { id: "proyecto", label: "Proyecto" },
];

const EJEMPLOS_BUSQUEDA = [
  "Pintura para impermeabilizar una terraza",
  "Tornillos autoperforantes",
  "Cable unipolar 2,5 mm",
];

const EJEMPLOS_PROYECTO = [
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
  const [modo, setModo] = useState<Modo>("escribir");

  const [consulta, setConsulta] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  const [descripcion, setDescripcion] = useState("");
  const [errorProyecto, setErrorProyecto] = useState<string | null>(null);

  const textoProyecto = descripcion.trim();
  const proyectoValido = textoProyecto.length >= DESCRIPCION_MIN;

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setErrorBusqueda(null);
    setErrorProyecto(null);
  }

  async function onBuscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const texto = consulta.trim();
    if (texto.length < CONSULTA_MIN) {
      setErrorBusqueda(
        `Contanos qué estás buscando (mínimo ${CONSULTA_MIN} caracteres).`,
      );
      return;
    }
    setErrorBusqueda(null);
    setBuscando(true);
    const res = await busquedaIaApi.interpretar(texto);
    setBuscando(false);
    if (!res.ok) {
      setErrorBusqueda(res.error);
      return;
    }
    const params = new URLSearchParams({ q: res.data.terminos });
    if (res.data.categoria) params.set("categoria", res.data.categoria);
    router.push(`/ofertas?${params.toString()}`);
  }

  function onProyecto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!proyectoValido) {
      setErrorProyecto(
        `Contanos un poco más sobre tu proyecto (mínimo ${DESCRIPCION_MIN} caracteres).`,
      );
      return;
    }
    guardarProyectoPendiente(textoProyecto, true);
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
            Buscador inteligente Obrix
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-obrix-black sm:text-6xl">
            Una sola herramienta para{" "}
            <span className="inline-block bg-obrix-orange px-2 text-obrix-black">
              encontrar
            </span>{" "}
            lo que necesitás.
          </h1>
          <p className="mt-5 text-lg text-neutral-600">
            Escribí lo que buscás y la IA entiende tu intención, subí una foto
            para identificar un material o describí tu proyecto y te armamos la
            lista de materiales.
          </p>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-obrix-black">
            {[
              "Encontrá cualquier producto",
              "La IA entiende tu intención",
              "Identificá materiales con una foto",
            ].map((item) => (
              <li
                key={item}
                className="rounded-full border border-neutral-200 bg-obrix-gray px-3 py-1.5"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-obrix-white p-2 text-left shadow-[0_24px_70px_-40px_rgba(23,23,23,0.45)] ring-1 ring-black/5">
            <div
              role="tablist"
              aria-label="Modo de búsqueda"
              className="flex gap-1 rounded-xl bg-obrix-gray p-1"
            >
              {MODOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={modo === item.id}
                  onClick={() => cambiarModo(item.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    modo === item.id
                      ? "bg-obrix-black text-obrix-white"
                      : "text-neutral-600 hover:text-obrix-black"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {modo === "escribir" && (
              <form onSubmit={onBuscar} className="mt-2">
                <label htmlFor="hero-consulta" className="sr-only">
                  ¿Qué estás buscando?
                </label>
                <input
                  id="hero-consulta"
                  type="text"
                  value={consulta}
                  onChange={(event) => {
                    setConsulta(event.target.value);
                    if (errorBusqueda) setErrorBusqueda(null);
                  }}
                  maxLength={CONSULTA_MAX}
                  aria-invalid={Boolean(errorBusqueda)}
                  placeholder="Ej: necesito una pintura para impermeabilizar una terraza"
                  className="w-full rounded-xl bg-transparent px-3 py-3 text-base text-obrix-black placeholder:text-neutral-400 focus:outline-none"
                />
                <div className="flex flex-col gap-2 border-t border-neutral-200 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-neutral-500">
                    La IA entiende sinónimos, marcas y categorías. No hace falta
                    el nombre exacto.
                  </p>
                  <button
                    type="submit"
                    disabled={buscando}
                    className="rounded-full bg-obrix-orange px-5 py-2.5 font-semibold text-obrix-black transition-colors hover:bg-[#e85c00] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buscando ? "Interpretando…" : "Buscar con IA"}
                  </button>
                </div>
                {errorBusqueda && (
                  <p role="alert" className="px-2 pb-1 text-sm text-red-600">
                    {errorBusqueda}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 px-2 pb-2 pt-1 text-sm">
                  <span className="text-xs text-neutral-500">Ejemplos:</span>
                  {EJEMPLOS_BUSQUEDA.map((ejemplo) => (
                    <button
                      key={ejemplo}
                      type="button"
                      onClick={() => {
                        setConsulta(ejemplo);
                        setErrorBusqueda(null);
                      }}
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-obrix-black transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
                    >
                      {ejemplo}
                    </button>
                  ))}
                </div>
              </form>
            )}

            {modo === "foto" && (
              <div className="mt-2 rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center">
                <span className="inline-block rounded-full bg-obrix-gray px-3 py-1 text-xs font-semibold uppercase tracking-wide text-obrix-black">
                  Próximamente
                </span>
                <p className="mx-auto mt-3 max-w-md text-sm text-neutral-600">
                  Vas a poder sacar una foto a una pieza, un tornillo o un
                  accesorio y Obrix va a identificar el tipo de objeto, sus
                  características visibles y los productos compatibles del
                  catálogo.
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs text-neutral-500">
                  La identificación por foto es probable, no confirmada: medidas,
                  roscas y especificaciones técnicas siempre se verifican aparte.
                </p>
              </div>
            )}

            {modo === "proyecto" && (
              <form onSubmit={onProyecto} className="mt-2">
                <label htmlFor="hero-descripcion" className="sr-only">
                  Describí tu proyecto
                </label>
                <textarea
                  id="hero-descripcion"
                  rows={3}
                  value={descripcion}
                  onChange={(event) => {
                    setDescripcion(event.target.value);
                    if (errorProyecto) setErrorProyecto(null);
                  }}
                  maxLength={DESCRIPCION_MAX}
                  aria-invalid={Boolean(errorProyecto)}
                  placeholder="Ej: quiero hacer una parrilla de 1,5 m en el fondo, con ladrillo y cemento."
                  className="w-full resize-none rounded-xl bg-transparent px-3 py-3 text-base text-obrix-black placeholder:text-neutral-400 focus:outline-none"
                />
                <div className="flex flex-col gap-2 border-t border-neutral-200 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-neutral-500">
                    Mínimo {DESCRIPCION_MIN} caracteres. La IA calcula
                    cantidades, cotiza en comercios y te deja armar el pedido.
                  </p>
                  <button
                    type="submit"
                    disabled={!proyectoValido}
                    className="rounded-full bg-obrix-orange px-5 py-2.5 font-semibold text-obrix-black transition-colors hover:bg-[#e85c00] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Armar mi lista de materiales
                  </button>
                </div>
                {errorProyecto && (
                  <p role="alert" className="px-2 pb-1 text-sm text-red-600">
                    {errorProyecto}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 px-2 pb-2 pt-1 text-sm">
                  <span className="text-xs text-neutral-500">Ejemplos:</span>
                  {EJEMPLOS_PROYECTO.map((ejemplo) => (
                    <button
                      key={ejemplo.label}
                      type="button"
                      onClick={() => {
                        setDescripcion(ejemplo.texto);
                        setErrorProyecto(null);
                      }}
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-obrix-black transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
                    >
                      {ejemplo.label}
                    </button>
                  ))}
                </div>
              </form>
            )}
          </div>

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
