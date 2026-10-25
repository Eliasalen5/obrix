import SolicitudesAltaManager from "./SolicitudesAltaManager";

export default function SolicitudesComercioPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Solicitudes de alta de comercios</h1>
      <p className="mt-2 text-sm text-gray-600">
        Revisar, aprobar o rechazar solicitudes de registro de comercios.
      </p>
      <SolicitudesAltaManager />
    </div>
  );
}
