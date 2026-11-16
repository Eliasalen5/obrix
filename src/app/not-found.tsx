import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada | Obrix",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p aria-hidden="true" className="text-7xl font-bold text-obrix-orange">
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-obrix-black">
        Página no encontrada
      </h1>
      <p className="mt-3 max-w-md text-neutral-600">
        La dirección puede estar mal escrita o la página ya no existe. Volvé al
        inicio para seguir buscando lo que necesitás.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-full bg-obrix-black px-6 py-2.5 font-semibold text-obrix-white transition-colors hover:bg-neutral-800"
        >
          Volver al inicio
        </Link>
        <Link
          href="/ofertas"
          className="rounded-full border border-obrix-black px-6 py-2.5 font-semibold text-obrix-black transition-colors hover:bg-obrix-gray"
        >
          Ver ofertas
        </Link>
      </div>
    </main>
  );
}
