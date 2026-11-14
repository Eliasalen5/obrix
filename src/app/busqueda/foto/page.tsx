import type { Metadata } from "next";
import ResultadoFoto from "./ResultadoFoto";

export const metadata: Metadata = {
  title: "Identificación por foto | Obrix",
  description:
    "Identificación visual de materiales y productos compatibles en comercios de tu zona.",
};

export default function BusquedaFotoPage() {
  return <ResultadoFoto />;
}
