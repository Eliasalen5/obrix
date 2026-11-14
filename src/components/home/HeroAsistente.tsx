"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
} from "@/lib/validators/asistente";
import { CONSULTA_MAX, CONSULTA_MIN } from "@/lib/validators/busqueda";
import { guardarProyectoPendiente } from "@/lib/proyecto/pendiente";
import { busquedaIaApi } from "@/lib/api/busquedaIaClient";
import { visionApi } from "@/lib/api/visionClient";
import { guardarResultadoVision } from "@/lib/vision/resultado";
import {
  IMAGEN_MAX_BYTES,
  TIPOS_IMAGEN_PERMITIDOS,
} from "@/lib/validators/vision";

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

  const [foto, setFoto] = useState<File | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  const [descripcion, setDescripcion] = useState("");
  const [errorProyecto, setErrorProyecto] = useState<string | null>(null);

  const textoProyecto = descripcion.trim();
  const proyectoValido = textoProyecto.length >= DESCRIPCION_MIN;

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setErrorBusqueda(null);
    setErrorProyecto(null);
    setErrorFoto(null);
  }

  async function onIdentificar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!foto) {
      setErrorFoto("Elegí o sacá una fotografía del material.");
      return;
    }
    if (foto.size > IMAGEN_MAX_BYTES) {
      setErrorFoto("La fotografía supera el máximo de 4 MB.");
      return;
    }
    setErrorFoto(null);
    setAnalizando(true);
    const res = await visionApi.identificar(foto);
    setAnalizando(false);
    if (!res.ok) {
      setErrorFoto(res.error);
      return;
    }
    guardarResultadoVision(res.data);
    router.push("/busqueda/foto");
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
    <section className="relative isolate overflow-hidden bg-obrix-black text-obrix-white">
      <Image
        src="/fondohero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-black/65 sm:bg-gradient-to-r sm:from-black/85 sm:via-black/60 sm:to-black/20"
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
        <div className="max-w-3xl text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-obrix-gray px-3 py-1 text-xs font-semibold uppercase tracking-wide text-obrix-black">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-obrix-orange"
            />
            Buscador inteligente Obrix
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-obrix-white sm:text-6xl">
            Todo para{" "}
            <span className="text-obrix-orange">
              construir, remodelar o reparar.
            </span>
          </h1>
          <p className="mt-5 text-lg text-neutral-200">
            Buscá productos, identificá materiales con una foto o calculá tu
            lista con IA.
          </p>

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
                    Entendemos lo que buscás, aunque no sepas el nombre exacto.
                  </p>
                  <button
                    type="submit"
                    disabled={buscando}
                    className="rounded-full bg-obrix-orange px-5 py-2.5 font-semibold text-obrix-black transition-colors hover:bg-[#e85c00] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buscando ? "Buscando…" : "Buscar"}
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
              <form onSubmit={onIdentificar} className="mt-2">
                <label
                  htmlFor="hero-foto"
                  className="block cursor-pointer rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-center transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
                >
                  <span className="block text-sm font-semibold text-obrix-black">
                    {foto ? foto.name : "Elegí o sacá una foto"}
                  </span>
                  <span className="mt-2 block text-xs text-neutral-500">
                    JPG, PNG o WebP · máximo 4 MB
                  </span>
                </label>
                <input
                  id="hero-foto"
                  type="file"
                  accept={TIPOS_IMAGEN_PERMITIDOS.join(",")}
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => {
                    setFoto(event.target.files?.[0] ?? null);
                    setErrorFoto(null);
                  }}
                />
                <p className="mt-2 px-2 text-xs text-neutral-500">
                  La identificación es orientativa; verificá medidas y
                  especificaciones.
                </p>
                <div className="mt-2 flex flex-col gap-2 border-t border-neutral-200 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-neutral-500">
                    La foto no se guarda.
                  </p>
                  <button
                    type="submit"
                    disabled={!foto || analizando}
                    className="rounded-full bg-obrix-orange px-5 py-2.5 font-semibold text-obrix-black transition-colors hover:bg-[#e85c00] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {analizando ? "Analizando foto…" : "Buscar por foto"}
                  </button>
                </div>
                {errorFoto && (
                  <p role="alert" className="px-2 pb-1 text-sm text-red-600">
                    {errorFoto}
                  </p>
                )}
              </form>
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
                  placeholder="Describí tu obra. Ej: una parrilla de 1,5 m."
                  className="w-full resize-none rounded-xl bg-transparent px-3 py-3 text-base text-obrix-black placeholder:text-neutral-400 focus:outline-none"
                />
                <div className="flex flex-col gap-2 border-t border-neutral-200 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-neutral-500">
                    La IA estima cantidades y compara precios.
                  </p>
                  <button
                    type="submit"
                    disabled={!proyectoValido}
                    className="rounded-full bg-obrix-orange px-5 py-2.5 font-semibold text-obrix-black transition-colors hover:bg-[#e85c00] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Calcular materiales
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


        </div>
      </div>
    </section>
  );
}
