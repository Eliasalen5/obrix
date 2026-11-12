import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { construirBusquedaProducto } from "../src/lib/text/busqueda";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const productos = await prisma.producto.findMany({
    select: {
      id: true,
      sku: true,
      nombre: true,
      unidad: true,
      descripcion: true,
      marca: true,
      fabricante: true,
      codigoFabricante: true,
      codigoBarras: true,
      busqueda: true,
    },
  });

  const pendientes = productos.filter(
    (p) => p.busqueda !== construirBusquedaProducto(p),
  );

  console.log(
    `Productos: ${productos.length}. A actualizar: ${pendientes.length}.`,
  );

  for (const producto of pendientes) {
    await prisma.producto.update({
      where: { id: producto.id },
      data: { busqueda: construirBusquedaProducto(producto) },
    });
  }

  console.log("Backfill de búsqueda completado.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error en backfill de búsqueda:", error);
  process.exit(1);
});
