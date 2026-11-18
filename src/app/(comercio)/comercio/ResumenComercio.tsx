"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  comercioResumenApi,
  type ResumenComercio as Resumen,
} from "@/lib/api/comercioClient";
import type { EstadoPedido } from "@/lib/api/pedidoClient";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  KpiCard,
  SkeletonRows,
  type BadgeTone,
} from "@/components/ui";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const fecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

const ESTADO_TONE: Record<string, BadgeTone> = {
  PENDIENTE: "warning",
  CONFIRMADO: "info",
  PREPARADO: "orange",
  ENTREGADO: "success",
  CANCELADO: "danger",
};

export default function ResumenComercio() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const res = await comercioResumenApi.get();
    if (res.ok) setResumen(res.data);
    else setError(res.error);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const limite = resumen?.plan.limiteProductos ?? null;
  const usoPct =
    resumen && limite !== null
      ? Math.min(100, Math.round((resumen.productos.publicados / limite) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Productos publicados"
          value={resumen?.productos.publicados ?? 0}
          hint={
            limite === null
              ? `${resumen?.plan.nombre ?? "Tu plan"} · productos ilimitados`
              : `${usoPct}% del límite de ${limite} (${resumen?.plan.nombre})`
          }
          loading={cargando}
        />
        <KpiCard
          label="Pedidos pendientes"
          value={resumen?.pedidos.pendientes ?? 0}
          hint="Requieren tu confirmación"
          loading={cargando}
        />
        <KpiCard
          label="Pedidos totales"
          value={resumen?.pedidos.total ?? 0}
          hint="Histórico acumulado"
          loading={cargando}
        />
        <KpiCard
          label="Ventas registradas"
          value={money.format(resumen?.ventas.total ?? 0)}
          hint="Excluye pedidos cancelados"
          loading={cargando}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          label="Ventas del mes"
          value={money.format(resumen?.ventas.mes ?? 0)}
          hint="Mes en curso"
          loading={cargando}
        />
        <KpiCard
          label="Ticket promedio"
          value={money.format(resumen?.ventas.ticketPromedio ?? 0)}
          hint="Sobre pedidos no cancelados"
          loading={cargando}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Pedidos recientes"
            description="Últimos pedidos recibidos"
            action={
              <Link href="/comercio/pedidos">
                <Button size="sm" variant="outline">
                  Ver todos
                </Button>
              </Link>
            }
          />
          {cargando ? (
            <SkeletonRows rows={3} />
          ) : !resumen || resumen.recientes.length === 0 ? (
            <EmptyState
              className="m-5 border-0 bg-transparent py-8"
              title="Todavía no recibiste pedidos"
              description="Cuando un cliente compre tus productos, vas a verlos acá."
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {resumen.recientes.map((pedido) => (
                <li
                  key={pedido.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-obrix-black">
                      Pedido #{pedido.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {fecha.format(new Date(pedido.createdAt))} ·{" "}
                      {pedido.itemsCount}{" "}
                      {pedido.itemsCount === 1 ? "ítem" : "ítems"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={ESTADO_TONE[pedido.estado] ?? "neutral"}>
                      {pedido.estado as EstadoPedido}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {money.format(pedido.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Accesos rápidos" />
          <div className="flex flex-col gap-2 p-5">
            <Link href="/comercio/ofertas">
              <Button variant="secondary" className="w-full justify-start">
                Gestionar productos
              </Button>
            </Link>
            <Link href="/comercio/pedidos">
              <Button variant="outline" className="w-full justify-start">
                Ver pedidos
              </Button>
            </Link>
            <Link href="/comercio/perfil">
              <Button variant="outline" className="w-full justify-start">
                Editar perfil comercial
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BloqueProximamente
          titulo="Analítica"
          descripcion="Ventas por período, top productos y evolución. Disponible en Plan Comercio."
        />
        <BloqueProximamente
          titulo="Asistente IA comercial"
          descripcion="Análisis de ventas, reposición y alertas de stock. Disponible en Plan Profesional."
        />
      </div>
    </div>
  );
}

function BloqueProximamente({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-obrix-black">{titulo}</h3>
        <Badge tone="neutral">Pronto</Badge>
      </div>
      <p className="mt-2 text-sm text-neutral-500">{descripcion}</p>
      <div className="mt-4 h-16 rounded-xl bg-gradient-to-r from-obrix-gray to-neutral-100" />
    </Card>
  );
}
