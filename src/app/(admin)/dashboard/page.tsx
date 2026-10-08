import { requireAdminSession } from "@/lib/auth/requireAdmin";

export default async function AdminDashboard() {
  await requireAdminSession();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Panel Admin - Obrix</h1>
      <p className="text-sm text-gray-600 mt-2">Catálogo maestro / Gestión</p>
    </div>
  );
}
