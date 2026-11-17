import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad - Obrix",
  description: "Cómo Obrix recopila, usa y protege tu información personal.",
};

export default function PrivacidadPage() {
  return (
    <main className="flex-1 bg-obrix-white text-obrix-black">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Política de privacidad</h1>
          <p className="mt-3 text-neutral-600">Última actualización: {new Date().toLocaleDateString("es-AR")}</p>
        </header>

        <article className="prose prose-obrix max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Responsable del tratamiento</h2>
            <p>Obrix (en adelante, &laquo;nosotros&raquo;), con domicilio en Argentina. Contacto: <a href="mailto:privacidad@obrix.com" className="text-obrix-orange hover:underline">privacidad@obrix.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Datos que recopilamos</h2>
            <h3 className="font-medium mt-4">Datos de identificación</h3>
            <p>Nombre, email, teléfono, dirección, rol (cliente/comercio/admin).</p>
            <h3 className="font-medium mt-4">Datos de uso</h3>
            <p>Proyectos creados, búsquedas, pedidos, interacciones con la plataforma.</p>
            <h3 className="font-medium mt-4">Datos técnicos</h3>
            <p>IP, tipo de dispositivo, navegador, logs de acceso.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Finalidad y base legal</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Prestación del servicio:</strong> gestionar cuenta, proyectos, pedidos, pagos (ejecución contractual).</li>
              <li><strong>Comunicaciones:</strong> notificaciones de estado, soporte (interés legítimo / consentimiento).</li>
              <li><strong>Mejora y seguridad:</strong> analítica, prevención de fraude (interés legítimo).</li>
              <li><strong>Marketing:</strong> novedades, ofertas (consentimiento, podés darte de baja).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Compartir datos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Con comercios: datos necesarios para procesar tu pedido (nombre, contacto, dirección de entrega).</li>
              <li>Proveedores de servicio: hosting, email, analytics, pagos (bajo contratos de procesamiento).</li>
              <li>Autoridades: si la ley lo requiere.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Transferencias internacionales</h2>
            <p>Nuestros proveedores pueden estar fuera de Argentina (ej. Vercel, Upstash). Usamos cláusulas contractuales estándar y mecanismos aprobados para garantizar protección adecuada.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Retención</h2>
            <p>Conservamos tus datos mientras la cuenta esté activa y durante los plazos legales aplicables (ej. 10 años para facturación). Podés solicitar supresión (ver derechos).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Seguridad</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>HTTPS/TLS en todas las comunicaciones.</li>
              <li>Contraseñas hasheadas con bcrypt.</li>
              <li>Autenticación JWT (NextAuth) con rotación de secretos.</li>
              <li>Rate limiting en endpoints públicos.</li>
              <li>Acceso a datos bajo principio de menor privilegio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Tus derechos (Ley 25.326)</h2>
            <p>Podés ejercer: acceso, rectificación, supresión, oposición, limitación, portabilidad. Escribinos a <a href="mailto:privacidad@obrix.com" className="text-obrix-orange hover:underline">privacidad@obrix.com</a>. Responderemos en el plazo legal.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Cookies</h2>
            <p>Usamos cookies técnicas (sesión, seguridad) y analíticas (opcionales). Ver <Link href="/cookies" className="text-obrix-orange hover:underline">Política de cookies</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Cambios</h2>
            <p>Notificaremos cambios materiales por email o en la plataforma. El uso continuado implica aceptación.</p>
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