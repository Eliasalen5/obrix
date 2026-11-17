import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y condiciones - Obrix",
  description: "Términos y condiciones de uso de la plataforma Obrix.",
};

export default function TerminosPage() {
  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Términos y condiciones</h1>
          <p className="mt-3 text-neutral-600">Última actualización: {new Date().toLocaleDateString("es-AR")}</p>
        </header>

        <article className="prose prose-obrix max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Aceptación de los términos</h2>
            <p>Al acceder y usar Obrix, aceptás estos Términos y Condiciones y nuestra Política de Privacidad. Si no estás de acuerdo, no uses la plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Descripción del servicio</h2>
            <p>Obrix es una plataforma que conecta clientes con comercios de materiales de construcción. Permite describir proyectos, calcular materiales, comparar ofertas y realizar pedidos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Cuentas y responsabilidades</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sos responsable de mantener la confidencialidad de tu cuenta.</li>
              <li>Debés proporcionar información veraz y actualizada.</li>
              <li>Notificanos inmediatamente cualquier uso no autorizado.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Pedidos y precios</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Las cotizaciones son referenciales y pueden cambiar.</li>
              <li>Los precios se congelan al confirmar el pedido.</li>
              <li>El comercio es responsable de la exactitud de sus ofertas y stock.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Limitación de responsabilidad</h2>
            <p>Obrix actúa como intermediario. No garantizamos la disponibilidad, calidad o entrega de los productos; eso es responsabilidad de cada comercio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Propiedad intelectual</h2>
            <p>El contenido, marca, diseño y código de Obrix son propiedad de Obrix o sus licenciantes. No podés copiar, modificar ni distribuir sin autorización.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Modificaciones</h2>
            <p>Podemos actualizar estos términos en cualquier momento. Los cambios entran en vigor al publicarse. El uso continuado implica aceptación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Ley aplicable y jurisdicción</h2>
            <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se resolverá en los tribunales competentes de la Ciudad Autónoma de Buenos Aires.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Contacto</h2>
            <p>Para consultas sobre estos términos: <a href="mailto:legal@obrix.com" className="text-obrix-orange hover:underline">legal@obrix.com</a></p>
          </section>
        </article>

        <nav className="mt-8 text-center" aria-label="Navegación secundaria">
          <Link href="/" className="text-sm text-obrix-orange hover:underline">
            ← Volver al inicio
          </Link>
        </nav>
      </div>
    </main>
  );
}