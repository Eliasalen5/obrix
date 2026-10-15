import Link from "next/link";

export default function ClientePanel() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Mi panel</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Describí tu proyecto, comparé comercios y seguí el estado de tus pedidos.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/cliente/proyecto"
          className="rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-medium">Nuevo proyecto</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Contá qué necesitás y generá una cotización comparada.
          </p>
        </Link>
        <Link
          href="/cliente/pedidos"
          className="rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-medium">Mis pedidos</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Mirá tus pedidos y su estado; podés cancelar los pendientes.
          </p>
        </Link>
      </div>
    </div>
  );
}
