import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso legal - Obrix",
  description: "Información legal de la plataforma Obrix: titular, condiciones de uso, propiedad intelectual.",
};

export default function AvisoLegalPage() {
  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Aviso legal</h1>
          <p className="mt-3 text-neutral-600">Información general conforme a la Ley 25.326 y normativa aplicable.</p>
        </header>

        <article className="prose prose-obrix max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Titular de la plataforma</h2>
            <dl className="space-y-2 mt-2">
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="font-medium text-neutral-700 w-40 flex-shrink-0">Denominación:</dt>
                <dd>Obrix</dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="font-medium text-neutral-700 w-40 flex-shrink-0">Domicilio:</dt>
                <dd>Argentina</dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="font-medium text-neutral-700 w-40 flex-shrink-0">Email legal:</dt>
                <dd><a href="mailto:legal@obrix.com" className="text-obrix-orange hover:underline">legal@obrix.com</a></dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="font-medium text-neutral-700 w-40 flex-shrink-0">Email privacidad:</dt>
                <dd><a href="mailto:privacidad@obrix.com" className="text-obrix-orange hover:underline">privacidad@obrix.com</a></dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-1">
                <dt className="font-medium text-neutral-700 w-40 flex-shrink-0">Email soporte:</dt>
                <dd><a href="mailto:soporte@obrix.com" className="text-obrix-orange hover:underline">soporte@obrix.com</a></dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Objeto</h2>
            <p>Este aviso regula el acceso y uso de la plataforma Obrix (en adelante, &laquo;la Plataforma&raquo;), puesta a disposición de los usuarios de Internet.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Condiciones de acceso y uso</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>El acceso es libre y gratuito para usuarios registrados.</li>
              <li>Queda prohibido usar la Plataforma con fines ilícitos, lesivos o que dañen su funcionamiento.</li>
              <li>El usuario responde de la veracidad de los datos aportados.</li>
              <li>Nos reservamos el derecho a denegar o retirar el acceso sin previo aviso a quien incumpla.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Propiedad intelectual e industrial</h2>
            <p>Todos los contenidos (textos, imágenes, diseño, código, marcas, logos, estructura, bases de datos) son titularidad de Obrix o de terceros licenciantes, protegidos por la legislación argentina e internacional.</p>
            <p>Queda prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otro uso sin autorización expresa y por escrito.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Exclusión de garantías y responsabilidad</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>La Plataforma se proporciona &laquo;tal cual&raquo;, sin garantías de disponibilidad continua, ausencia de errores o idoneidad para un fin particular.</li>
              <li>No nos hacemos responsables de daños derivados del uso, interrupciones, virus, fallos de telecomunicaciones, o acciones de terceros.</li>
              <li>Los enlaces a sitios de terceros no implican respaldo ni responsabilidad sobre sus contenidos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Protección de datos personales</h2>
            <p>El tratamiento de datos personales se rige por nuestra <Link href="/privacidad" className="text-obrix-orange hover:underline">Política de privacidad</Link>, conforme a la Ley 25.326 y normativa concordante.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Cookies</h2>
            <p>El uso de cookies se detalla en nuestra <Link href="/cookies" className="text-obrix-orange hover:underline">Política de cookies</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Duración y modificación</h2>
            <p>Las condiciones tienen vigencia indefinida. Podemos modificar este aviso en cualquier momento; la versión actualizada se publica en esta URL.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Ley aplicable y jurisdicción</h2>
            <p>Este aviso se rige por la ley argentina. Para cualquier controversia, las partes se someten a los tribunales de la Ciudad Autónoma de Buenos Aires, renunciando a cualquier otro fuero.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Contacto</h2>
            <p>Para cualquier consulta sobre este aviso legal: <a href="mailto:legal@obrix.com" className="text-obrix-orange hover:underline">legal@obrix.com</a></p>
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