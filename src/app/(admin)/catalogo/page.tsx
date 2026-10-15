import CatalogoManager from "./CatalogoManager";

export default function CatalogoAdmin() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Catálogo maestro</h1>
      <p className="mt-2 text-sm text-gray-600">
        Gestión de categorías y productos del catálogo.
      </p>
      <CatalogoManager />
    </div>
  );
}
