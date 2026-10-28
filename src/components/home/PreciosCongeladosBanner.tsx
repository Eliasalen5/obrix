export default function PreciosCongeladosBanner() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <svg
              className="h-10 w-10 text-zinc-700 dark:text-zinc-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
            Precios congelados al confirmar tu pedido
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Al confirmar el pedido, guardamos el precio y disponibilidad vigentes
            en ese momento. Si volvés a cotizar más tarde, verás los precios
            actualizados.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Las cotizaciones son referenciales y pueden cambiar según stock o
            precios del comercio.
          </p>
        </div>
      </div>
    </section>
  );
}
