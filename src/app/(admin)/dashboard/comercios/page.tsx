import ComerciosManager from "./ComerciosManager";

export default function AdminComerciosPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Comercios y planes</h1>
      <p className="mt-2 text-sm text-gray-600">
        Asignación manual de planes y comisiones.
      </p>
      <div className="mt-6">
        <ComerciosManager />
      </div>
    </div>
  );
}
