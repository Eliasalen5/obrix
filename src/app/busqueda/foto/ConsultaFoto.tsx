"use client";

import { useState } from "react";
import { visionApi } from "@/lib/api/visionClient";
import type {
  IdentificacionVisual,
  OfertaCompatible,
} from "@/lib/validators/vision";
import OfertaCompatCard from "./OfertaCompatCard";

const SUGERENCIAS = [
  "¿Tenés uno más largo?",
  "¿Hay una versión de acero inoxidable?",
  "¿Qué comercios lo venden?",
];

type Mensaje = {
  id: number;
  rol: "usuario" | "asistente";
  texto: string;
  ofertas?: OfertaCompatible[];
};

let nextId = 1;

export default function ConsultaFoto({
  identificacion,
  detalle,
}: {
  identificacion: IdentificacionVisual;
  detalle?: string;
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(texto: string) {
    const limpio = texto.trim();
    if (limpio.length < 3 || consultando) return;

    setError(null);
    setConsultando(true);
    setMensajes((prev) => [
      ...prev,
      { id: nextId++, rol: "usuario", texto: limpio },
    ]);
    setPregunta("");

    const res = await visionApi.consultar({
      pregunta: limpio,
      contexto: { identificacion, detalle },
    });

    setConsultando(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    setMensajes((prev) => [
      ...prev,
      {
        id: nextId++,
        rol: "asistente",
        texto: res.data.respuesta,
        ofertas: res.data.ofertas,
      },
    ]);
  }

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-obrix-white p-5">
      <h2 className="text-xl font-bold tracking-tight">Preguntá sobre tu foto</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Con la identificación de tu imagen podemos seguir buscando variantes o
        comercios. Las respuestas se basan en el catálogo real.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGERENCIAS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => enviar(s)}
            disabled={consultando}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-obrix-black transition-colors hover:border-obrix-orange hover:bg-obrix-gray disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {mensajes.length > 0 && (
        <div className="mt-5 space-y-4">
          {mensajes.map((m) => (
            <div key={m.id}>
              <div
                className={
                  m.rol === "usuario"
                    ? "ml-auto max-w-xl rounded-2xl bg-obrix-black px-4 py-2 text-sm text-obrix-white"
                    : "max-w-xl rounded-2xl bg-obrix-gray px-4 py-2 text-sm text-obrix-black"
                }
              >
                {m.texto}
              </div>
              {m.ofertas && m.ofertas.length > 0 && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {m.ofertas.map((oferta) => (
                    <OfertaCompatCard key={oferta.id} oferta={oferta} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(pregunta);
        }}
      >
        <label htmlFor="pregunta-foto" className="sr-only">
          Escribí tu pregunta
        </label>
        <input
          id="pregunta-foto"
          type="text"
          value={pregunta}
          onChange={(e) => {
            setPregunta(e.target.value);
            if (error) setError(null);
          }}
          maxLength={300}
          placeholder="Ej: ¿hay una versión de acero inoxidable?"
          className="w-full rounded-full border border-neutral-300 bg-obrix-gray px-4 py-2.5 text-sm placeholder:text-neutral-500 focus:border-obrix-orange focus:bg-obrix-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={consultando || pregunta.trim().length < 3}
          className="shrink-0 rounded-full bg-obrix-orange px-5 py-2.5 text-sm font-semibold text-obrix-black transition-colors hover:bg-[#e85c00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {consultando ? "Buscando…" : "Preguntar"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
