import Link from "next/link";
import { notFound } from "next/navigation";
import { disponibilidadTexto, money } from "@/lib/ofertas/presentacion";
import { obtenerOfertaPublica } from "@/lib/services/oferta.service";
import CotizarOfertaButton from "./CotizarOfertaButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OfertaPage({ params }: Props) {
  const { id } = await params;
  const oferta = await obtenerOfertaPublica(id);
  if (!oferta) notFound();

  const marca = oferta.marca || oferta.producto.marca;
  const localidad = [oferta.comercio.localidad, oferta.comercio.provincia]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <Link
          href="/ofertas"
          className="text-sm text-neutral-600 hover:text-obrix-black"
        >
          ← Volver a ofertas
        </Link>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-obrix-white p-6 sm:p-8">
          <span
            aria-hidden="true"
            className="mb-3 block h-1 w-12 rounded-full bg-obrix-orange"
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {oferta.producto.categoria.nombre}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {oferta.producto.nombre}
          </h1>

          <dl className="mt-4 space-y-1 text-sm text-neutral-600">
            {marca && (
              <div className="flex gap-2">
                <dt className="font-medium text-obrix-black">Marca:</dt>
                <dd>{marca}</dd>
              </div>
            )}
            {oferta.presentacion && (
              <div className="flex gap-2">
                <dt className="font-medium text-obrix-black">Presentación:</dt>
                <dd>{oferta.presentacion}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="font-medium text-obrix-black">Unidad:</dt>
              <dd>{oferta.producto.unidad}</dd>
            </div>
          </dl>

          {oferta.producto.descripcion && (
            <p className="mt-4 text-neutral-700">
              {oferta.producto.descripcion}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-end gap-4 border-t border-neutral-200 pt-6">
            <p className="text-3xl font-bold text-obrix-black">
              {money.format(oferta.precio)}
            </p>
            <p className="pb-1 text-sm text-neutral-600">
              Disponibilidad: {disponibilidadTexto(oferta.stock)}
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-obrix-gray p-4 text-sm">
            <p className="font-semibold text-obrix-black">
              {oferta.comercio.nombre}
            </p>
            <p className="text-neutral-600">{oferta.comercio.direccion}</p>
            {localidad && <p className="text-neutral-600">{localidad}</p>}
          </div>

          <div className="mt-6">
            <CotizarOfertaButton
              productoNombre={oferta.producto.nombre}
              marca={marca}
            />
          </div>

          <p className="mt-4 text-xs text-neutral-500">
            El precio se congela al confirmar el pedido. Las cotizaciones son
            referenciales.
          </p>
        </div>
      </div>
    </main>
  );
}
