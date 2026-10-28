import Link from "next/link";

const CATEGORIAS = [
  { nombre: "Cemento y hormigón", slug: "cemento" },
  { nombre: "Hierro y acero", slug: "hierro" },
  { nombre: "Ladrillos y bloques", slug: "ladrillos" },
  { nombre: "Pintura y revestimientos", slug: "pintura" },
  { nombre: "Sanitarios y grifería", slug: "sanitarios" },
  { nombre: "Herramientas", slug: "herramientas" },
  { nombre: "Electricidad", slug: "electricidad" },
  { nombre: "Plomería", slug: "plomeria" },
];

export default function CategoriasDestacadas() {
  return (
    <section id="categorias" className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Categorías destacadas
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Empezá por rubro o dejá que el asistente te arme todo
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIAS.map((cat) => (
          <Link
            key={cat.slug}
            href="/cliente/proyecto"
            className="group rounded-xl border border-zinc-200 p-4 transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{cat.nombre}</h3>
              <svg
                className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
