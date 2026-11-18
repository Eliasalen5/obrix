import { PageHeader } from "@/components/ui";
import OfertasManager from "./OfertasManager";

export default function OfertasComercio() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Productos"
        title="Mis productos"
        description="Publicá productos del catálogo maestro y ajustá precio, stock y marca."
      />
      <OfertasManager />
    </div>
  );
}
