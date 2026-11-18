import { PageHeader } from "@/components/ui";
import PerfilComercio from "./PerfilComercio";

export default function PerfilComercioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cuenta"
        title="Perfil comercial"
        description="Actualizá los datos y la ubicación de tu comercio."
      />
      <PerfilComercio />
    </div>
  );
}
