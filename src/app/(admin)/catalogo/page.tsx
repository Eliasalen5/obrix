import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export default async function CatalogoAdmin() {
  await requireAdminSession();
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: "asc" },
  });
  const productos = await prisma.producto.findMany({
    include: { categoria: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Catálogo maestro</h1>
      <p className="text-sm text-gray-600 mt-2">
        {categorias.length} categorías / {productos.length} productos
      </p>
    </div>
  );
}
