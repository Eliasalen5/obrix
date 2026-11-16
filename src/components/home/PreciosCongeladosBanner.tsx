export default function PreciosCongeladosBanner() {
  return (
    <section className="bg-obrix-white text-obrix-black">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-200 bg-obrix-gray px-5 py-4 text-center sm:flex-row sm:text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-obrix-black">
            <svg
              className="h-5 w-5 text-obrix-orange"
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
          <div>
            <h2 className="text-base font-semibold">
              Precios congelados al confirmar tu pedido
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Guardamos el precio y la disponibilidad vigentes al confirmar. Las
              cotizaciones son referenciales y pueden cambiar al volver a
              cotizar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
