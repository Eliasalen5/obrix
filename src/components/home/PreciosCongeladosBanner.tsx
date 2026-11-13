export default function PreciosCongeladosBanner() {
  return (
    <section className="bg-obrix-white text-obrix-black">
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-obrix-gray p-6 sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-obrix-black">
                <svg
                  className="h-6 w-6 text-obrix-orange"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
              Precios congelados al confirmar tu pedido
            </h2>
            <p className="mt-3 text-neutral-600">
              Al confirmar el pedido, guardamos el precio y disponibilidad
              vigentes en ese momento. Si volvés a cotizar más tarde, verás los
              precios actualizados.
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Las cotizaciones son referenciales y pueden cambiar según stock o
              precios del comercio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
