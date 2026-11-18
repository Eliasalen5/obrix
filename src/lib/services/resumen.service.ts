import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/planes";
import { redondear2 } from "./pedido-estado";

export type ResumenPedidoReciente = {
  id: string;
  estado: string;
  total: number;
  createdAt: Date;
  itemsCount: number;
};

export type ResumenComercioData = {
  plan: {
    id: string;
    nombre: string;
    comisionPct: number;
    limiteProductos: number | null;
  };
  productos: { publicados: number; activos: number };
  pedidos: { total: number; pendientes: number };
  ventas: { total: number; mes: number; ticketPromedio: number };
  recientes: ResumenPedidoReciente[];
};

const RECIENTES_LIMITE = 5;

function inicioDeMes(ahora = new Date()): Date {
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
}

/**
 * Métricas agregadas del panel del comercio. Todo se filtra por `comercioId`
 * (derivado de la sesión en la ruta) para garantizar el aislamiento multi-tenant.
 * Las ventas excluyen pedidos CANCELADO.
 */
export async function obtenerResumenComercio(
  comercioId: string,
): Promise<ResumenComercioData> {
  const desde = inicioDeMes();

  const comercioPromise = prisma.comercio
    .findUnique({
      where: { id: comercioId },
      select: { plan: true },
    })
    .catch(() => null);

  const [
    comercio,
    publicados,
    activos,
    totalPedidos,
    pendientes,
    pedidosVendidos,
    ventasTotales,
    ventasMes,
    recientes,
  ] = await Promise.all([
    comercioPromise,
    prisma.oferta.count({ where: { comercioId } }),
    prisma.oferta.count({ where: { comercioId, activo: true } }),
    prisma.pedido.count({ where: { comercioId } }),
    prisma.pedido.count({ where: { comercioId, estado: "PENDIENTE" } }),
    prisma.pedido.count({
      where: { comercioId, estado: { not: "CANCELADO" } },
    }),
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: { comercioId, estado: { not: "CANCELADO" } },
    }),
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        comercioId,
        estado: { not: "CANCELADO" },
        createdAt: { gte: desde },
      },
    }),
    prisma.pedido.findMany({
      where: { comercioId },
      orderBy: { createdAt: "desc" },
      take: RECIENTES_LIMITE,
      select: {
        id: true,
        estado: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  const totalVendido = ventasTotales._sum.total ?? 0;
  const ticketPromedio =
    pedidosVendidos > 0 ? redondear2(totalVendido / pedidosVendidos) : 0;
  const plan = getPlan(comercio?.plan);

  return {
    plan: {
      id: plan.id,
      nombre: plan.nombre,
      comisionPct: plan.comisionPct,
      limiteProductos: plan.limiteProductos,
    },
    productos: { publicados, activos },
    pedidos: { total: totalPedidos, pendientes },
    ventas: {
      total: redondear2(totalVendido),
      mes: redondear2(ventasMes._sum.total ?? 0),
      ticketPromedio,
    },
    recientes: recientes.map((pedido) => ({
      id: pedido.id,
      estado: pedido.estado,
      total: pedido.total,
      createdAt: pedido.createdAt,
      itemsCount: pedido._count.items,
    })),
  };
}
