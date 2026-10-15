import OfertasManager from "./OfertasManager";

export default function OfertasComercio() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Mis ofertas</h1>
      <p className="mt-2 text-sm text-gray-600">
        Activá productos del catálogo maestro y ajustá precio, stock y marca.
      </p>
      <OfertasManager />
    </div>
  );
}
