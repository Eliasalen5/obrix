import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de cookies - Obrix",
  description: "Qué cookies usa Obrix y cómo gestionarlas.",
};

export default function CookiesPage() {
  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Política de cookies</h1>
          <p className="mt-3 text-neutral-600">Última actualización: {new Date().toLocaleDateString("es-AR")}</p>
        </header>

        <article className="prose prose-obrix max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Qué son las cookies</h2>
            <p>Pequeños archivos de texto que se guardan en tu dispositivo al visitar un sitio web. Permiten recordar preferencias, mantener la sesión y analizar el uso.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Tipos de cookies que usamos</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-300">
                  <th className="text-left p-2 font-semibold">Categoría</th>
                  <th className="text-left p-2 font-semibold">Finalidad</th>
                  <th className="text-left p-2 font-semibold">Ejemplos</th>
                  <th className="text-left p-2 font-semibold">Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-200">
                  <td className="p-2 font-medium">Esenciales / Técnicas</td>
                  <td className="p-2">Sesión, autenticación, seguridad (CSRF), preferencias de consentimiento.</td>
                  <td className="p-2">next-auth.session-token, __Host-next-auth.csrf-token</td>
                  <td className="p-2">Sesión / 1 año</td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <td className="p-2 font-medium">Analíticas / Rendimiento</td>
                  <td className="p-2">Entender cómo usás la web, mejorar UX (opcional, requieren consentimiento).</td>
                  <td className="p-2">_ga, _gid (Google Analytics) — solo si aceptás</td>
                  <td className="p-2">2 años / 24 h</td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <td className="p-2 font-medium">Funcionales</td>
                  <td className="p-2">Recordar ubicación, filtros, modo oscuro (opcional).</td>
                  <td className="p-2">ubicacion, theme</td>
                  <td className="p-2">1 año</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Cookies de terceros</h2>
            <p>Podemos usar servicios de terceros que instalan sus propias cookies (ej. Google Analytics, Vercel Analytics). Sus políticas rigen esas cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Gestión y consentimiento</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Las cookies esenciales se instalan automáticamente (base: interés legítimo / necesidad contractual).</li>
              <li>Analíticas y funcionales requieren tu consentimiento explícito (banner al entrar).</li>
              <li>Podés retirar consentimiento o borrar cookies desde la configuración de tu navegador.</li>
              <li>Desactivar esenciales puede romper la funcionalidad (login, pedidos).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Cómo desactivar/borrar</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Chrome: Configuración → Privacidad → Cookies y datos de sitios</li>
              <li>Firefox: Opciones → Privacidad y seguridad → Cookies y datos del sitio</li>
              <li>Safari: Preferencias → Privacidad → Gestionar datos de sitios</li>
              <li>Edge: Configuración → Cookies y permisos del sitio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Cambios</h2>
            <p>Actualizaremos esta política si cambian las cookies o finalidades. La versión vigente siempre está en esta URL.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Contacto</h2>
            <p>Dudas sobre cookies: <a href="mailto:privacidad@obrix.com" className="text-obrix-orange hover:underline">privacidad@obrix.com</a></p>
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