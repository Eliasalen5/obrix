import Link from "next/link";

export default function ComercioPanel() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Panel del comercio</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Activá productos del catálogo maestro y gestioná los pedidos que
        recibís.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/comercio/ofertas"
          className="rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-medium">Mis ofertas</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Definí precio, stock y marca de los productos que vendés.
          </p>
        </Link>
        <Link
          href="/comercio/pedidos"
          className="rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-medium">Pedidos</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Seguí y avanzá el estado de los pedidos recibidos.
          </p>
        </Link>
      </div>
    </div>
  );
}
