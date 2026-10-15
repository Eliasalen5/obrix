import PedidosManager from "./PedidosManager";

export default function PedidosComercioPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Pedidos recibidos</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Confirmá, prepará o entregá los pedidos de tus clientes.
      </p>
      <div className="mt-6">
        <PedidosManager />
      </div>
    </div>
  );
}
