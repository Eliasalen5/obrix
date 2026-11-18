import { PageHeader } from "@/components/ui";
import ResumenComercio from "./ResumenComercio";

export default function ComercioPanel() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resumen"
        title="Tu negocio de un vistazo"
        description="Gestioná tus productos y pedidos, y seguí la actividad de tu comercio."
      />
      <ResumenComercio />
    </div>
  );
}
