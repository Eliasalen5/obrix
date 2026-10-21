import SolicitudesManager from "./SolicitudesManager";

export default function SolicitudesAdmin() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Solicitudes de productos</h1>
      <p className="mt-2 text-sm text-gray-600">
        Revisá, aprobá, vinculá o rechazá los productos propuestos por los
        comercios antes de publicarlos en el catálogo maestro.
      </p>
      <SolicitudesManager />
    </div>
  );
}
