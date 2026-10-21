"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  solicitudAdminApi,
  type EstadoSolicitud,
  type SolicitudProducto,
} from "@/lib/api/solicitudClient";
import { catalogoApi, type Producto } from "@/lib/api/catalogoClient";

type Mensaje = { tipo: "ok" | "error"; texto: string };

type FiltroEstado = "PENDIENTE_REVISION" | "TODAS" | "PROCESADAS";

const FILTROS: { value: FiltroEstado; label: string }[] = [
  { value: "PENDIENTE_REVISION", label: "Pendientes" },
  { value: "TODAS", label: "Todas" },
  { value: "PROCESADAS", label: "Procesadas" },
];

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  PENDIENTE_REVISION: "Pendiente",
  APROBADA: "Aprobada",
  VINCULADA: "Vinculada",
  RECHAZADA: "Rechazada",
};

const inputCls =
  "rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function SolicitudesManager() {
  const [solicitudes, setSolicitudes] = useState<SolicitudProducto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtro, setFiltro] = useState<FiltroEstado>("PENDIENTE_REVISION");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const [rechazoId, setRechazoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const [vincularId, setVincularId] = useState<string | null>(null);
  const [productoElegido, setProductoElegido] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    const estadoParam =
      filtro === "PENDIENTE_REVISION" ? "PENDIENTE_REVISION" : undefined;
    const [sols, prods] = await Promise.all([
      solicitudAdminApi.listSolicitudes(estadoParam),
      catalogoApi.listProductos(),
    ]);
    if (sols.ok) setSolicitudes(sols.data);
    else setMensaje({ tipo: "error", texto: sols.error });
    if (prods.ok) setProductos(prods.data);
    setCargando(false);
  }, [filtro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    if (filtro === "PENDIENTE_REVISION") {
      return solicitudes.filter((s) => s.estado === "PENDIENTE_REVISION");
    }
    if (filtro === "PROCESADAS") {
      return solicitudes.filter((s) => s.estado !== "PENDIENTE_REVISION");
    }
    return solicitudes;
  }, [solicitudes, filtro]);

  const opcionesProducto = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (q === "") return productos.slice(0, 50);
    return productos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [productos, busquedaProducto]);

  const aprobar = useCallback(
    async (id: string) => {
      const res = await solicitudAdminApi.aprobar(id, { modo: "nuevo" });
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: "Producto aprobado y publicado" });
        await cargar();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    },
    [cargar],
  );

  const vincular = useCallback(
    async (id: string) => {
      if (productoElegido === "") {
        setMensaje({ tipo: "error", texto: "Elegí un producto existente" });
        return;
      }
      const res = await solicitudAdminApi.aprobar(id, {
        modo: "vincular",
        productoId: productoElegido,
      });
      if (res.ok) {
        setMensaje({
          tipo: "ok",
          texto: "Solicitud vinculada al producto existente",
        });
        setVincularId(null);
        setProductoElegido("");
        await cargar();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    },
    [productoElegido, cargar],
  );

  const rechazar = useCallback(
    async (id: string) => {
      const res = await solicitudAdminApi.rechazar(id, motivo);
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: "Solicitud rechazada" });
        setRechazoId(null);
        setMotivo("");
        await cargar();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    },
    [motivo, cargar],
  );

  return (
    <div className="mt-4 space-y-4">
      {mensaje && (
        <p
          className={
            mensaje.tipo === "ok"
              ? "text-sm text-green-600"
              : "text-sm text-red-600"
          }
        >
          {mensaje.texto}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltro(f.value)}
            className={
              filtro === f.value
                ? "rounded bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay solicitudes para este filtro.
        </p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((s) => (
            <li
              key={s.id}
              className="rounded border border-zinc-300 p-4 dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-base font-medium">{s.datos.nombre}</h3>
                  <p className="text-sm text-gray-500">
                    {s.comercio?.nombre ?? s.comercioId} · {s.datos.unidad}
                  </p>
                </div>
                <span className="text-sm text-gray-600">
                  {ESTADO_LABEL[s.estado]}
                </span>
              </div>

              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 sm:grid-cols-3">
                <div>
                  <dt className="text-gray-400">Marca</dt>
                  <dd>{s.datos.marca || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Fabricante</dt>
                  <dd>{s.datos.fabricante || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Cód. barras</dt>
                  <dd>{s.datos.codigoBarras || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Cód. fabricante</dt>
                  <dd>{s.datos.codigoFabricante || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Precio inicial</dt>
                  <dd>{s.datos.precio}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Stock inicial</dt>
                  <dd>{s.datos.stock === -1 ? "sin control" : s.datos.stock}</dd>
                </div>
              </dl>

              {s.datos.descripcion && (
                <p className="mt-2 text-sm text-gray-600">
                  {s.datos.descripcion}
                </p>
              )}

              {s.estado === "RECHAZADA" && s.motivoRechazo && (
                <p className="mt-2 text-sm text-red-600">
                  Motivo: {s.motivoRechazo}
                </p>
              )}
              {s.producto && (
                <p className="mt-2 text-sm text-green-700">
                  Producto maestro: {s.producto.nombre} ({s.producto.sku})
                </p>
              )}

              {s.estado === "PENDIENTE_REVISION" && (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void aprobar(s.id)}
                      className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                    >
                      Aprobar como nuevo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVincularId(vincularId === s.id ? null : s.id);
                        setProductoElegido("");
                        setBusquedaProducto("");
                      }}
                      className="rounded border border-blue-600 px-3 py-1 text-sm text-blue-600"
                    >
                      Vincular a existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRechazoId(rechazoId === s.id ? null : s.id);
                        setMotivo("");
                      }}
                      className="rounded border border-red-600 px-3 py-1 text-sm text-red-600"
                    >
                      Rechazar
                    </button>
                  </div>

                  {vincularId === s.id && (
                    <div className="rounded border border-zinc-300 p-3 dark:border-zinc-700">
                      <input
                        className={`${inputCls} w-full`}
                        placeholder="Buscar producto por nombre o SKU"
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                      />
                      <select
                        className={`${inputCls} mt-2 w-full`}
                        value={productoElegido}
                        onChange={(e) => setProductoElegido(e.target.value)}
                      >
                        <option value="">Elegí un producto</option>
                        {opcionesProducto.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} — {p.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void vincular(s.id)}
                        className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm text-white"
                      >
                        Vincular y crear oferta
                      </button>
                    </div>
                  )}

                  {rechazoId === s.id && (
                    <div className="rounded border border-zinc-300 p-3 dark:border-zinc-700">
                      <textarea
                        className={`${inputCls} w-full`}
                        rows={2}
                        placeholder="Motivo del rechazo"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => void rechazar(s.id)}
                        className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white"
                      >
                        Confirmar rechazo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
