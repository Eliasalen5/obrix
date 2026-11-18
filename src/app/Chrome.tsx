"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import Footer from "@/components/layout/Footer";

function useOcultarChromePublico(): boolean {
  const pathname = usePathname();
  return Boolean(pathname?.startsWith("/comercio"));
}

export function PublicNavBar() {
  return useOcultarChromePublico() ? null : <NavBar />;
}

export function PublicFooter() {
  return useOcultarChromePublico() ? null : <Footer />;
}
