"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  comercioPedidoApi,
  type EstadoPedido,
  type Pedido,
} from "@/lib/api/pedidoClient";
import {
  Alert,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  Select,
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

const ESTADO_TONE: Record<EstadoPedido, BadgeTone> = {
  PENDIENTE: "warning",
  CONFIRMADO: "info",
  PREPARADO: "orange",
  ENTREGADO: "success",
  CANCELADO: "danger",
};

const ESTADOS: EstadoPedido[] = [
  "PENDIENTE",
  "CONFIRMADO",
  "PREPARADO",
  "ENTREGADO",
  "CANCELADO",
];

const SIGUIENTE: Partial<
  Record<EstadoPedido, { estado: EstadoPedido; label: string }>
> = {
  PENDIENTE: { estado: "CONFIRMADO", label: "Confirmar pedido" },
  CONFIRMADO: { estado: "PREPARADO", label: "Marcar preparado" },
  PREPARADO: { estado: "ENTREGADO", label: "Marcar entregado" },
};

const TH =
  "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500";
const TD = "px-4 py-3 align-middle text-sm text-obrix-black";

export default function PedidosManager() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"" | EstadoPedido>("");
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await comercioPedidoApi.listar();
    if (res.ok) setPedidos(res.data);
    else setError(res.error);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiar = useCallback(
    async (id: string, estado: EstadoPedido) => {
      setError(null);
      setAccionando(id);
      const res = await comercioPedidoApi.cambiarEstado(id, estado);
      setAccionando(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await cargar();
    },
    [cargar],
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toUpperCase();
    return pedidos.filter((p) => {
      if (filtroEstado && p.estado !== filtroEstado) return false;
      if (q && !p.id.toUpperCase().includes(q)) return false;
      return true;
    });
  }, [pedidos, busqueda, filtroEstado]);

  const detalle = pedidos.find((p) => p.id === detalleId) ?? null;

  return (
    <div className="space-y-5">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3">
          <Input
            placeholder="Buscar por número de pedido"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as "" | EstadoPedido)}
            className="w-auto"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-xs text-neutral-500">
            {filtrados.length} de {pedidos.length}
          </span>
        </div>

        {cargando ? (
          <SkeletonRows rows={5} />
        ) : pedidos.length === 0 ? (
          <EmptyState
            className="m-5 border-0 bg-transparent"
            title="Todavía no recibiste pedidos"
            description="Cuando un cliente compre tus productos, los vas a ver acá."
          />
        ) : filtrados.length === 0 ? (
          <EmptyState
            className="m-5 border-0 bg-transparent"
            title="Sin resultados"
            description="Probá con otro número o estado."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-obrix-gray/60">
                <tr>
                  <th className={TH}>Pedido</th>
                  <th className={TH}>Fecha</th>
                  <th className={TH}>Ítems</th>
                  <th className={TH}>Total</th>
                  <th className={TH}>Estado</th>
                  <th className={TH} />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-100">
                    <td className={`${TD} font-medium`}>
                      #{p.id.slice(-6).toUpperCase()}
                    </td>
                    <td className={`${TD} text-neutral-500`}>
                      {fecha.format(new Date(p.createdAt))}
                    </td>
                    <td className={TD}>{p.items.length}</td>
                    <td className={`${TD} font-semibold`}>
                      {money.format(p.total)}
                    </td>
                    <td className={TD}>
                      <Badge tone={ESTADO_TONE[p.estado]} dot>
                        {p.estado}
                      </Badge>
                    </td>
                    <td className={`${TD} text-right`}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetalleId(p.id)}
                      >
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={Boolean(detalle)}
        onClose={() => setDetalleId(null)}
        title={detalle ? `Pedido #${detalle.id.slice(-6).toUpperCase()}` : ""}
        description={
          detalle ? fecha.format(new Date(detalle.createdAt)) : undefined
        }
        footer={
          detalle ? (
            <div className="flex flex-wrap justify-end gap-2">
              {detalle.estado !== "ENTREGADO" &&
              detalle.estado !== "CANCELADO" ? (
                <Button
                  variant="danger"
                  loading={accionando === detalle.id}
                  onClick={() => void cambiar(detalle.id, "CANCELADO")}
                >
                  Cancelar pedido
                </Button>
              ) : null}
              {SIGUIENTE[detalle.estado] ? (
                <Button
                  loading={accionando === detalle.id}
                  onClick={() =>
                    void cambiar(detalle.id, SIGUIENTE[detalle.estado]!.estado)
                  }
                >
                  {SIGUIENTE[detalle.estado]!.label}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        {detalle ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Badge tone={ESTADO_TONE[detalle.estado]} dot>
                {detalle.estado}
              </Badge>
              <span className="text-lg font-semibold">
                {money.format(detalle.total)}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Ítems
              </p>
              <ul className="mt-2 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                {detalle.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{it.producto.nombre}</span>
                      <span className="block text-xs text-neutral-500">
                        {it.cantidad} {it.producto.unidad} ·{" "}
                        {money.format(it.precioUnitario)} c/u
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">
                      {money.format(it.cantidad * it.precioUnitario)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
