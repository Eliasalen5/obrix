import Link from "next/link";

const PASOS = [
  {
    titulo: "1. Contá tu proyecto",
    texto:
      "Escribí qué querés hacer (una parrilla, un muro, un contrapiso...) y el asistente estima los materiales.",
  },
  {
    titulo: "2. Compará comercios",
    texto:
      "Obrix cotiza contra los comercios de la zona y ordena por cobertura, distancia y precio.",
  },
  {
    titulo: "3. Hacé tu pedido",
    texto:
      "Elegí el comercio que más te conviene y generá el pedido con los precios congelados.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Ferreterías y corralones
        </p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight">
          Obrix te dice <span className="text-zinc-500">qué comprar</span>,{" "}
          <span className="text-zinc-500">dónde</span> y{" "}
          <span className="text-zinc-500">a cuánto</span>.
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Describí tu proyecto, el asistente calcula los materiales, comparamos
          los comercios cercanos y armás el pedido en un rato.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/ingresar"
            className="rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Empezar
          </Link>
          <Link
            href="/ingresar"
            className="rounded-full border border-zinc-300 px-5 py-2.5 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Soy comercio
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        {PASOS.map((paso) => (
          <div
            key={paso.titulo}
            className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <h2 className="font-medium">{paso.titulo}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {paso.texto}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
