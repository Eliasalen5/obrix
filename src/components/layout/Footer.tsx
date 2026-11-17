"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const currentYear = new Date().getFullYear();

const FOOTER_LINKS = {
  producto: [
    {
      title: "Para clientes",
      links: [
        { label: "Nuevo proyecto", href: "/cliente/proyecto" },
        { label: "Mis pedidos", href: "/cliente/pedidos" },
        { label: "Ver ofertas", href: "/ofertas" },
      ],
    },
    {
      title: "Para comercios",
      links: [
        { label: "Panel de comercio", href: "/comercio" },
        { label: "Mis ofertas", href: "/comercio/ofertas" },
        { label: "Pedidos recibidos", href: "/comercio/pedidos" },
      ],
    },
    {
      title: "Para administradores",
      links: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Catálogo maestro", href: "/catalogo" },
        { label: "Solicitudes", href: "/solicitudes" },
      ],
    },
    {
      title: "Desarrolladores",
      links: [{ label: "Documentación API", href: "/api" }],
    },
  ],
  ayuda: [
    { label: "Centro de ayuda", href: "/ayuda" },
    { label: "Preguntas frecuentes", href: "/ayuda#faq" },
    { label: "Contacto / Soporte", href: "/ayuda#contacto" },
    { label: "Guía de inicio", href: "/ayuda#guia" },
  ],
  legal: [
    { label: "Términos y condiciones", href: "/terminos" },
    { label: "Política de privacidad", href: "/privacidad" },
    { label: "Política de cookies", href: "/cookies" },
    { label: "Aviso legal", href: "/aviso-legal" },
  ],
  confianza: [
    "Precios congelados al confirmar",
    "Sin comisiones ocultas",
    "Datos seguros (HTTPS + bcrypt)",
  ],
};

const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://linkedin.com", ariaLabel: "Obrix en LinkedIn" },
  { name: "X", href: "https://x.com", ariaLabel: "Obrix en X" },
  { name: "GitHub", href: "https://github.com", ariaLabel: "Obrix en GitHub" },
];

const SocialIcon = ({ name }: { name: string }) => {
  switch (name) {
    case "LinkedIn":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "X":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.24-3.932 1.061L11.25 15.175l-7.48 7.78-3.867-1.061 8.212-9.34L0 2.25h3.445l7.52 8.31 8.13-9.12z" />
        </svg>
      );
    case "GitHub":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
      );
    default:
      return null;
  }
};

function FooterSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details className={`group ${className}`} open={open}>
      <summary
        className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-obrix-white"
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
        aria-expanded={open}
      >
        {title}
        <svg
          className="h-4 w-4 text-obrix-orange transition-transform duration-200 group-open:rotate-180 lg:hidden"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="mt-3 space-y-2 lg:mt-0 lg:space-y-3">{children}</div>
    </details>
  );
}

export default function Footer() {
  return (
    <footer role="contentinfo" className="bg-obrix-black text-obrix-white border-t border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:py-14">
        <div className="grid gap-6 lg:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand - 2 cols en lg */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2" aria-label="Obrix, ir al inicio">
              <Image src="/logo.jpg" alt="" width={32} height={32} className="h-8 w-auto rounded-lg object-contain" />
            </Link>
            <p className="text-sm text-neutral-300 max-w-xs">
              Obrix: materiales, precios y pedidos en un click.
            </p>
            <div className="flex gap-4 lg:hidden" aria-label="Redes sociales">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.ariaLabel}
                  className="text-neutral-400 hover:text-obrix-orange transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon name={social.name} />
                </a>
              ))}
            </div>
          </div>

          {/* Producto */}
          <nav aria-label="Producto" className="space-y-3">
            <h3 className="text-sm font-semibold text-obrix-white uppercase tracking-wide">Producto</h3>
            {FOOTER_LINKS.producto.map((group) => (
              <div key={group.title} className="space-y-2">
                <h4 className="text-xs font-medium text-obrix-orange uppercase tracking-wider">{group.title}</h4>
                <ul className="space-y-1.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-neutral-300 hover:text-obrix-orange transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Ayuda */}
          <nav aria-label="Ayuda" className="space-y-3">
            <h3 className="text-sm font-semibold text-obrix-white uppercase tracking-wide">Ayuda</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.ayuda.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-neutral-300 hover:text-obrix-orange transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal" className="space-y-3">
            <h3 className="text-sm font-semibold text-obrix-white uppercase tracking-wide">Legal</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-neutral-300 hover:text-obrix-orange transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Confianza - solo desktop como columna, en mobile dentro de acordeón */}
          <div className="hidden lg:block space-y-3">
            <h3 className="text-sm font-semibold text-obrix-white uppercase tracking-wide">Confianza</h3>
            <ul className="space-y-2" role="list" aria-label="Badges de confianza">
              {FOOTER_LINKS.confianza.map((badge) => (
                <li key={badge} className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="h-4 w-4 text-obrix-orange flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile: Confianza como acordeón */}
        <div className="lg:hidden mt-8 pt-8 border-t border-neutral-800">
          <FooterSection title="Confianza">
            <ul className="space-y-2" role="list" aria-label="Badges de confianza">
              {FOOTER_LINKS.confianza.map((badge) => (
                <li key={badge} className="flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="h-4 w-4 text-obrix-orange flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {badge}
                </li>
              ))}
            </ul>
          </FooterSection>
        </div>

        {/* Redes sociales - solo desktop */}
        <div className="hidden lg:flex lg:justify-end lg:items-center mt-10 pt-8 border-t border-neutral-800">
          <p className="text-xs text-neutral-500 mr-4">Síguenos:</p>
          <div className="flex gap-4" aria-label="Redes sociales">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                aria-label={social.ariaLabel}
                className="text-neutral-400 hover:text-obrix-orange transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialIcon name={social.name} />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500 text-center sm:text-left">
            © {currentYear} Obrix. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500">
            <span>Hecho en Argentina</span>
            <span aria-hidden="true">·</span>
            <span>v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}