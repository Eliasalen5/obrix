"use client";

import Link from "next/link";
import { disponibilidadTexto, money } from "@/lib/ofertas/presentacion";
import type { OfertaCompatible } from "@/lib/validators/vision";

const ETIQUETA_NIVEL: Record<OfertaCompatible["nivel"], string> = {
  alta: "Coincidencia alta",
  probable: "Coincidencia probable",
  similar: "Alternativa similar",
};

const ESTILO_NIVEL: Record<OfertaCompatible["nivel"], string> = {
  alta: "bg-green-100 text-green-900",
  probable: "bg-obrix-orange/15 text-obrix-black",
  similar: "bg-neutral-200 text-neutral-700",
};

export default function OfertaCompatCard({
  oferta,
}: {
  oferta: OfertaCompatible;
}) {
  const detalle = [oferta.marca, oferta.presentacion, oferta.unidad]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-obrix-white p-5 transition-all hover:border-obrix-orange hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden="true"
          className="block h-1 w-10 rounded-full bg-obrix-orange"
        />
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_NIVEL[oferta.nivel]}`}
        >
          {ETIQUETA_NIVEL[oferta.nivel]}
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {oferta.categoria}
      </p>
      <h3 className="mt-1 text-lg font-semibold leading-tight text-obrix-black">
        {oferta.productoNombre}
      </h3>
      {detalle && <p className="mt-1 text-sm text-neutral-500">{detalle}</p>}
      {oferta.descripcion && (
        <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
          {oferta.descripcion}
        </p>
      )}

      {oferta.caracteristicasCoincidentes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {oferta.caracteristicasCoincidentes.map((c) => (
            <li
              key={c}
              className="rounded-full bg-obrix-gray px-2 py-0.5 text-xs text-obrix-black"
            >
              {c}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold text-obrix-black">
          {money.format(oferta.precio)}
        </p>
        <p className="text-right text-xs text-neutral-600">
          {disponibilidadTexto(oferta.stock)}
        </p>
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-3 text-sm">
        <p className="font-medium text-obrix-black">{oferta.comercioNombre}</p>
        <p className="text-neutral-500">{oferta.comercioDireccion}</p>
        {oferta.localidad && (
          <p className="text-neutral-500">{oferta.localidad}</p>
        )}
      </div>

      <Link
        href={`/oferta/${oferta.id}`}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-obrix-black px-4 py-2 text-sm font-semibold text-obrix-white transition-colors hover:bg-obrix-orange hover:text-obrix-black"
      >
        Ver producto
      </Link>
    </article>
  );
}
