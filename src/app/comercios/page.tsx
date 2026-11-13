import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comercios | Obrix",
  description: "Comercios de materiales activos en Obrix.",
};

export default async function ComerciosPage() {
  const comercios = await prisma.comercio.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      direccion: true,
      telefono: true,
      _count: {
        select: { ofertas: { where: { activo: true } } },
      },
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <span
          aria-hidden="true"
          className="mb-3 block h-1 w-12 rounded-full bg-obrix-orange"
        />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Comercios
        </h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Ferreterías, corralones y pinturerías que ya publican sus ofertas en
          Obrix.
        </p>

        {comercios.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-neutral-200 bg-obrix-gray p-8 text-center">
            <p className="text-lg font-semibold">Todavía no hay comercios</p>
            <p className="mt-2 text-sm text-neutral-600">
              Si tenés un comercio de materiales, podés sumarte y empezar a
              recibir pedidos.
            </p>
            <Link
              href="/registro/comercio"
              className="mt-4 inline-block rounded-full bg-obrix-orange px-5 py-2.5 text-sm font-semibold text-obrix-black transition-colors hover:bg-[#e85c00]"
            >
              Sumar mi comercio
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comercios.map((comercio) => (
              <article
                key={comercio.id}
                className="flex flex-col rounded-2xl border border-neutral-200 p-5 transition-all hover:border-obrix-orange hover:shadow-lg"
              >
                <h2 className="text-lg font-semibold leading-tight">
                  {comercio.nombre}
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  {comercio.direccion}
                </p>
                {comercio.telefono && (
                  <p className="mt-1 text-sm text-neutral-500">
                    Tel. {comercio.telefono}
                  </p>
                )}
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {comercio._count.ofertas}{" "}
                  {comercio._count.ofertas === 1
                    ? "oferta activa"
                    : "ofertas activas"}
                </p>
                <Link
                  href={`/ofertas?comercioId=${encodeURIComponent(comercio.id)}`}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:border-obrix-orange hover:bg-obrix-gray"
                >
                  Ver ofertas
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
