"use client";

import { useCallback, useEffect, useState } from "react";
import {
  comercioPedidoApi,
  type EstadoPedido,
  type Pedido,
} from "@/lib/api/pedidoClient";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const fecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

const COLOR_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  CONFIRMADO: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PREPARADO: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  ENTREGADO: "bg-green-500/10 text-green-700 dark:text-green-400",
  CANCELADO: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const SIGUIENTE: Partial<Record<EstadoPedido, { estado: EstadoPedido; label: string }>> =
  {
    PENDIENTE: { estado: "CONFIRMADO", label: "Confirmar" },
    CONFIRMADO: { estado: "PREPARADO", label: "Marcar preparado" },
    PREPARADO: { estado: "ENTREGADO", label: "Marcar entregado" },
  };

export default function PedidosManager() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionando, setAccionando] = useState<string | null>(null);

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

  if (cargando) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (pedidos.length === 0)
    return <p className="text-sm text-zinc-500">Todavía no recibiste pedidos.</p>;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {pedidos.map((p) => {
        const siguiente = SIGUIENTE[p.estado];
        const puedeCancelar =
          p.estado !== "ENTREGADO" && p.estado !== "CANCELADO";
        const ocupado = accionando === p.id;

        return (
          <article
            key={p.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">
                  Pedido #{p.id.slice(-6).toUpperCase()}
                </h3>
                <p className="text-xs text-zinc-500">
                  {fecha.format(new Date(p.createdAt))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${COLOR_ESTADO[p.estado]}`}
                >
                  {p.estado}
                </span>
                <span className="font-semibold">{money.format(p.total)}</span>
              </div>
            </div>

            <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {p.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-4">
                  <span>
                    {it.cantidad} {it.producto.unidad} · {it.producto.nombre}
                  </span>
                  <span>{money.format(it.cantidad * it.precioUnitario)}</span>
                </li>
              ))}
            </ul>

            {(siguiente || puedeCancelar) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {siguiente && (
                  <button
                    onClick={() => void cambiar(p.id, siguiente.estado)}
                    disabled={ocupado}
                    className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {siguiente.label}
                  </button>
                )}
                {puedeCancelar && (
                  <button
                    onClick={() => void cambiar(p.id, "CANCELADO")}
                    disabled={ocupado}
                    className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-600 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
