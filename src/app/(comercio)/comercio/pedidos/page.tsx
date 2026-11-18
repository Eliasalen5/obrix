import { PageHeader } from "@/components/ui";
import PedidosManager from "./PedidosManager";

export default function PedidosComercioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pedidos"
        title="Pedidos recibidos"
        description="Confirmá, prepará o entregá los pedidos de tus clientes."
      />
      <PedidosManager />
    </div>
  );
}
