"use client";

import Link from "next/link";
import { guardarProyectoPendiente } from "@/lib/proyecto/pendiente";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type OfertaCardProps = {
  productoNombre: string;
  marca: string;
  presentacion: string;
  unidad: string;
  precio: number;
  categoria: string;
  comercioNombre: string;
  comercioDireccion: string;
};

export default function OfertaCard({
  productoNombre,
  marca,
  presentacion,
  unidad,
  precio,
  categoria,
  comercioNombre,
  comercioDireccion,
}: OfertaCardProps) {
  const detalle = [marca, presentacion, unidad].filter(Boolean).join(" · ");

  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-obrix-white p-5 transition-all hover:border-obrix-orange hover:shadow-lg">
      <span
        aria-hidden="true"
        className="mb-3 block h-1 w-10 rounded-full bg-obrix-orange"
      />
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {categoria}
      </p>
      <h2 className="mt-1 text-lg font-semibold leading-tight text-obrix-black">
        {productoNombre}
      </h2>
      {detalle && <p className="mt-1 text-sm text-neutral-500">{detalle}</p>}

      <p className="mt-4 text-2xl font-bold text-obrix-black">
        {money.format(precio)}
      </p>

      <div className="mt-4 border-t border-neutral-200 pt-3 text-sm">
        <p className="font-medium text-obrix-black">{comercioNombre}</p>
        <p className="text-neutral-500">{comercioDireccion}</p>
      </div>

      <Link
        href="/cliente/proyecto"
        onClick={() =>
          guardarProyectoPendiente(
            `Quiero cotizar ${productoNombre}${marca ? ` de ${marca}` : ""}.`,
            true,
          )
        }
        className="mt-4 inline-flex items-center justify-center rounded-full bg-obrix-orange px-4 py-2 text-sm font-semibold text-obrix-black transition-colors hover:bg-[#e85c00]"
      >
        Cotizar este material
      </Link>
    </article>
  );
}
