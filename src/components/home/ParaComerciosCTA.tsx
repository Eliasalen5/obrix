import Link from "next/link";

export default function ParaComerciosCTA() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Sumá tu comercio y empezá a recibir pedidos
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Sumá tu ferretería, corralón, pinturería o negocio de materiales a
            Obrix y empezá a recibir pedidos directos de clientes que ya están
            buscando lo que vos vendés. Publicá tus ofertas y gestioná tu stock
            desde un solo lugar.
          </p>
          <ul className="mt-6 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            <li className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Publicá productos y precios
            </li>
            <li className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Recibí pedidos de tu zona
            </li>
            <li className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Mantené tus ofertas actualizadas
            </li>
            <li className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Sumate gratis, sin comisiones ocultas
            </li>
          </ul>
          <Link
            href="/ingresar"
            className="mt-8 inline-block rounded-full bg-zinc-900 px-6 py-2.5 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Quiero sumar mi negocio
          </Link>
        </div>
      </div>
    </section>
  );
}
