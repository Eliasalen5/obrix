"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const currentYear = 2026;

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Categorías", href: "/ofertas" },
  { label: "Comercios", href: "/comercios" },
  { label: "Cómo funciona", href: "/ayuda#guia" },
];

const COMERCIO_LINKS = [
  { label: "Publicar mi comercio", href: "/registro/comercio" },
  { label: "Planes", href: "/registro/comercio#planes" },
];

const AYUDA_LINKS = [
  { label: "Contacto", href: "/ayuda#contacto" },
  { label: "Preguntas frecuentes", href: "/ayuda#faq" },
];

const LEGAL_LINKS = [
  { label: "Términos y condiciones", href: "/terminos" },
  { label: "Política de privacidad", href: "/privacidad" },
];

const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://linkedin.com", ariaLabel: "Obrix en LinkedIn" },
  { name: "X", href: "https://x.com", ariaLabel: "Obrix en X" },
  { name: "Instagram", href: "https://instagram.com", ariaLabel: "Obrix en Instagram" },
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
    case "Instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    default:
      return null;
  }
};

function FooterColumn({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <details className={`group ${className}`} open={open}>
      <summary
        className="flex items-center justify-between cursor-pointer list-none text-xs font-semibold text-obrix-white uppercase tracking-wide"
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
      <div className="mt-2 space-y-2 lg:mt-0 lg:space-y-2">{children}</div>
    </details>
  );
}

export default function Footer() {
  return (
    <footer role="contentinfo" className="bg-obrix-black text-obrix-white border-t border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:py-6">
        <div className="grid gap-4 lg:gap-8 grid-cols-2 lg:grid-cols-5">
          {/* Marca */}
          <div className="lg:col-span-2 space-y-2">
            <Link href="/" className="flex items-center gap-2" aria-label="Obrix, ir al inicio">
              <Image src="/logo.jpg" alt="" width={28} height={28} className="h-7 w-auto rounded-lg object-contain" />
            </Link>
            <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
              Marketplace de materiales de construcción. Conectamos clientes con comercios locales para cotizar y pedir en un click.
            </p>
            <div className="flex gap-3 lg:hidden" aria-label="Redes sociales">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.ariaLabel}
                  className="text-neutral-500 hover:text-obrix-orange transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon name={social.name} />
                </a>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <FooterColumn title="Navegación">
            <nav aria-label="Navegación principal">
              <ul className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-neutral-300 hover:text-obrix-orange transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </FooterColumn>

          {/* Comercios */}
          <FooterColumn title="Comercios">
            <nav aria-label="Para comercios">
              <ul className="space-y-2">
                {COMERCIO_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-neutral-300 hover:text-obrix-orange transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </FooterColumn>

          {/* Ayuda */}
          <FooterColumn title="Ayuda">
            <nav aria-label="Ayuda y soporte">
              <ul className="space-y-2">
                {AYUDA_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-neutral-300 hover:text-obrix-orange transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </FooterColumn>

          {/* Legal + Redes sociales */}
          <FooterColumn title="Legal">
            <nav aria-label="Información legal">
              <ul className="space-y-2">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-neutral-300 hover:text-obrix-orange transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="hidden lg:flex lg:justify-end gap-3 mt-4 pt-4 border-t border-neutral-800" aria-label="Redes sociales">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.ariaLabel}
                  className="text-neutral-500 hover:text-obrix-orange transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon name={social.name} />
                </a>
              ))}
            </div>
          </FooterColumn>
        </div>

        {/* Bottom bar */}
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500 text-center sm:text-left">
            © {currentYear} Obrix. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}