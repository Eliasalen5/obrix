import MisPedidos from "./MisPedidos";

export default function MisPedidosPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Mis pedidos</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Seguí el estado de tus pedidos. Podés cancelar los que siguen
        pendientes.
      </p>
      <div className="mt-6">
        <MisPedidos />
      </div>
    </div>
  );
}
