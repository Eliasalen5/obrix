import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Centro de ayuda - Obrix",
  description: "Encontrá respuestas a tus preguntas sobre Obrix: cómo funciona, pedidos, comercios y más.",
};

const FAQ = [
  {
    q: "¿Cómo creo un proyecto en Obrix?",
    a: "Desde la página principal, describí tu proyecto en el asistente o subí una foto del material. Obrix calcula los materiales y te muestra ofertas de comercios cercanos.",
  },
  {
    q: "¿Cómo hago un pedido?",
    a: "Una vez que tenés la cotización, elegís el comercio, confirmás el pedido y el comercio lo prepara. Los precios se congelan al confirmar.",
  },
  {
    q: "¿Puedo cancelar un pedido?",
    a: "Sí, desde tu panel de cliente podés cancelar pedidos mientras el comercio no los haya confirmado.",
  },
  {
    q: "¿Cómo sumo mi comercio a Obrix?",
    a: "Entrá a 'Sumá tu comercio' en el footer o en el home, completá el formulario de solicitud y nuestro equipo la revisará.",
  },
  {
    q: "¿Qué significa 'precios congelados'?",
    a: "Al confirmar tu pedido, guardamos el precio y la disponibilidad vigentes en ese momento. Las cotizaciones previas son referenciales.",
  },
];

export default function AyudaPage() {
  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Centro de ayuda</h1>
          <p className="mt-3 text-neutral-600">Encontrá respuestas rápidas o contactanos si necesitás más ayuda.</p>
        </header>

        <section aria-labelledby="faq-heading" className="space-y-6">
          <h2 id="faq-heading" className="text-xl font-semibold">Preguntas frecuentes</h2>
          <dl className="space-y-4">
            {FAQ.map(({ q, a }, i) => (
              <div key={i} className="border border-neutral-200 rounded-xl p-4">
                <dt className="font-medium text-obrix-black">{q}</dt>
                <dd className="mt-2 text-neutral-600">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="contacto" className="mt-12 pt-8 border-t border-neutral-200 text-center">
          <h2 className="text-xl font-semibold">¿No encontraste lo que buscabas?</h2>
          <p className="mt-2 text-neutral-600">Escribinos a <a href="mailto:soporte@obrix.com" className="text-obrix-orange hover:underline">soporte@obrix.com</a> y te respondemos a la brevedad.</p>
        </section>

        <nav className="mt-8 text-center" aria-label="Navegación secundaria">
          <Link href="/" className="text-sm text-obrix-orange hover:underline">
            ← Volver al inicio
          </Link>
        </nav>
      </div>
    </main>
  );
}