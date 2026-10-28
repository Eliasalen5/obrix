import Link from "next/link";
import Image from "next/image";

const CATEGORIAS = [
  { nombre: "Cemento y hormigón", slug: "cemento", img: "/cemento.jpg" },
  { nombre: "Hierro y acero", slug: "hierro", img: "/hierro.jpg" },
  { nombre: "Ladrillos y bloques", slug: "ladrillos", img: "/ladrillos.jpg" },
  { nombre: "Pintura y revestimientos", slug: "pintura", img: "/pintura.jpg" },
  { nombre: "Sanitarios y grifería", slug: "sanitarios", img: "/sanitarios.jpg" },
  { nombre: "Herramientas", slug: "herramientas", img: "/herramientas.jpg" },
  { nombre: "Electricidad", slug: "electricidad", img: "/electricidad.jpg" },
  { nombre: "Plomería", slug: "plomeria", img: "/plomeria.jpg" },
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIAS.map((cat) => (
          <Link
            key={cat.slug}
            href="/cliente/proyecto"
            className="group relative overflow-hidden rounded-xl border border-zinc-200 transition-all hover:shadow-lg dark:border-zinc-800"
          >
            <div className="relative h-36 w-full">
              <Image
                src={cat.img}
                alt={cat.nombre}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-medium text-white drop-shadow-sm">
                {cat.nombre}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
