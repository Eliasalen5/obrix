"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { asistenteApi, type AsistenteResponse } from "@/lib/api/asistenteClient";
import {
  cotizacionApi,
  type ComercioComparado,
  type CotizacionResponse,
} from "@/lib/api/cotizacionClient";
import { pedidoApi, type Pedido } from "@/lib/api/pedidoClient";

type Paso = "describir" | "materiales" | "ranking";
type Mensaje = { tipo: "ok" | "error"; texto: string };
type MaterialEdit = { nombre: string; cantidad: string; unidad: string };

const inputCls =
  "rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function ProyectoWizard() {
  const [paso, setPaso] = useState<Paso>("describir");
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const [descripcion, setDescripcion] = useState("");
  const [proyecto, setProyecto] = useState<AsistenteResponse | null>(null);
  const [materiales, setMateriales] = useState<MaterialEdit[]>([]);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const [cotizacion, setCotizacion] = useState<CotizacionResponse | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);

  const estimar = useCallback(async () => {
    setMensaje(null);
    setOcupado(true);
    const res = await asistenteApi.estimar(descripcion);
    setOcupado(false);
    if (!res.ok) {
      setMensaje({
        tipo: "error",
        texto: res.details?.length
          ? `${res.error}: ${res.details.map((d) => d.message).join(" | ")}`
          : res.error,
      });
      return;
    }
    setProyecto(res.data);
    setMateriales(
      res.data.materiales.map((m) => ({
        nombre: m.nombre,
        cantidad: String(m.cantidad),
        unidad: m.unidad,
      })),
    );
    setPaso("materiales");
  }, [descripcion]);

  const cotizar = useCallback(async () => {
    setMensaje(null);
    const limpios = materiales
      .map((m) => ({
        nombre: m.nombre.trim(),
        cantidad: Number(m.cantidad),
        unidad: m.unidad.trim(),
      }))
      .filter((m) => m.nombre.length > 0 && m.unidad.length > 0);

    if (limpios.length === 0 || limpios.some((m) => !(m.cantidad > 0))) {
      setMensaje({
        tipo: "error",
        texto: "Cada material necesita nombre, unidad y una cantidad mayor a 0.",
      });
      return;
    }

    setOcupado(true);
    const res = await cotizacionApi.crear({
      prompt: descripcion,
      materiales: limpios,
      ubicacion: ubicacion ?? undefined,
    });
    setOcupado(false);
    if (!res.ok) {
      setMensaje({
        tipo: "error",
        texto: res.details?.length
          ? `${res.error}: ${res.details.map((d) => d.message).join(" | ")}`
          : res.error,
      });
      return;
    }
    setCotizacion(res.data);
    setPaso("ranking");
  }, [materiales, descripcion, ubicacion]);

  const hacerPedido = useCallback(
    async (comercio: ComercioComparado) => {
      if (!cotizacion) return;
      setMensaje(null);
      setOcupado(true);
      const res = await pedidoApi.crear({
        cotizacionId: cotizacion.cotizacion.id,
        comercioId: comercio.comercioId,
      });
      setOcupado(false);
      if (!res.ok) {
        setMensaje({ tipo: "error", texto: res.error });
        return;
      }
      setPedido(res.data);
      setMensaje({
        tipo: "ok",
        texto: `Pedido creado en ${comercio.nombre}.`,
      });
    },
    [cotizacion],
  );

  const usarUbicacion = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUbicacion({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () =>
        setMensaje({
          tipo: "error",
          texto: "No pudimos obtener tu ubicación. Podés cotizar igual.",
        }),
    );
  }, []);

  function actualizarMaterial(i: number, cambio: Partial<MaterialEdit>) {
    setMateriales((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, ...cambio } : m)),
    );
  }

  return (
    <div className="space-y-6">
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

      {paso === "describir" && (
        <section className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="descripcion">
            ¿Qué querés hacer?
          </label>
          <textarea
            id="descripcion"
            rows={5}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: quiero hacer una parrilla de 1,5 m en el fondo, con ladrillo y cemento."
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <p className="text-xs text-zinc-500">Mínimo 10 caracteres.</p>
          <button
            onClick={() => void estimar()}
            disabled={ocupado || descripcion.trim().length < 10}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {ocupado ? "Pensando…" : "Sugerir materiales"}
          </button>
        </section>
      )}

      {paso === "materiales" && proyecto && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">{proyecto.titulo}</h2>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
              {proyecto.aviso} (modo {proyecto.modo})
            </p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1 pr-2">Material</th>
                <th className="py-1 pr-2">Cantidad</th>
                <th className="py-1 pr-2">Unidad</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {materiales.map((m, i) => (
                <tr key={i} className="border-b">
                  <td className="py-1 pr-2">
                    <input
                      className={`${inputCls} w-full`}
                      value={m.nombre}
                      onChange={(e) =>
                        actualizarMaterial(i, { nombre: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      className={inputCls}
                      inputMode="decimal"
                      value={m.cantidad}
                      onChange={(e) =>
                        actualizarMaterial(i, { cantidad: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      className={inputCls}
                      value={m.unidad}
                      onChange={(e) =>
                        actualizarMaterial(i, { unidad: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-1">
                    <button
                      onClick={() =>
                        setMateriales((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="text-red-600"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() =>
              setMateriales((prev) => [
                ...prev,
                { nombre: "", cantidad: "1", unidad: "unidad" },
              ])
            }
            className="text-sm text-blue-600"
          >
            + Agregar material
          </button>

          <div className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <p className="font-medium">Ubicación (opcional)</p>
            <p className="mt-1 text-xs text-zinc-500">
              Si la compartís, ordenamos los comercios también por distancia.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={usarUbicacion}
                className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Usar mi ubicación
              </button>
              {ubicacion && (
                <>
                  <span className="text-xs text-zinc-500">
                    {ubicacion.lat.toFixed(3)}, {ubicacion.lng.toFixed(3)}
                  </span>
                  <button
                    onClick={() => setUbicacion(null)}
                    className="text-xs text-red-600"
                  >
                    Quitar
                  </button>
                </>
              )}
            </div>
          </div>

          {proyecto.aclaraciones.length > 0 && (
            <ul className="list-inside list-disc text-xs text-zinc-500">
              {proyecto.aclaraciones.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => void cotizar()}
              disabled={ocupado}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {ocupado ? "Cotizando…" : "Cotizar y comparar"}
            </button>
            <button
              onClick={() => setPaso("describir")}
              className="text-sm text-zinc-500"
            >
              Volver
            </button>
          </div>
        </section>
      )}

      {paso === "ranking" && cotizacion && (
        <section className="space-y-4">
          {pedido && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-3 text-sm">
              Pedido creado por {money.format(pedido.total)} en {pedido.comercio.nombre}.{" "}
              <Link href="/cliente/pedidos" className="text-blue-600 underline">
                Ver mis pedidos
              </Link>
            </div>
          )}

          {cotizacion.comparacion.advertencias.map((a, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-500">
              {a}
            </p>
          ))}

          <h2 className="text-lg font-medium">
            Comercios ({cotizacion.comparacion.comercios.length})
          </h2>

          {cotizacion.comparacion.comercios.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Ningún comercio cubre los materiales de esta cotización.
            </p>
          ) : (
            <div className="space-y-4">
              {cotizacion.comparacion.comercios.map((c) => (
                <article
                  key={c.comercioId}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{c.nombre}</h3>
                      <p className="text-xs text-zinc-500">
                        {c.direccion}
                        {c.telefono ? ` · ${c.telefono}` : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{money.format(c.total)}</p>
                      <p className="text-xs text-zinc-500">
                        {c.itemsCubiertos} de {c.itemsTotales} materiales
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {c.cubreTodo ? (
                      <span className="rounded bg-green-500/10 px-2 py-0.5 text-green-700 dark:text-green-400">
                        Cubre todo
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-500">
                        Faltan {c.faltantes.length}
                      </span>
                    )}
                    {c.distanciaKm !== null && (
                      <span className="rounded bg-zinc-500/10 px-2 py-0.5 text-zinc-600 dark:text-zinc-300">
                        {c.distanciaKm} km
                      </span>
                    )}
                    {!c.esTotalCompleto && (
                      <span className="text-zinc-500">
                        (subtotal de lo disponible)
                      </span>
                    )}
                  </div>

                  {c.faltantes.length > 0 && (
                    <p className="mt-2 text-xs text-zinc-500">
                      No cubre: {c.faltantes.map((f) => f.nombre).join(", ")}
                    </p>
                  )}

                  <button
                    onClick={() => void hacerPedido(c)}
                    disabled={ocupado}
                    className="mt-3 rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Hacer pedido
                  </button>
                </article>
              ))}
            </div>
          )}

          {cotizacion.comparacion.sinMatch.length > 0 && (
            <p className="text-xs text-zinc-500">
              Sin match en el catálogo:{" "}
              {cotizacion.comparacion.sinMatch.map((s) => s.nombre).join(", ")}
            </p>
          )}

          <button
            onClick={() => setPaso("materiales")}
            className="text-sm text-zinc-500"
          >
            Volver a materiales
          </button>
        </section>
      )}
    </div>
  );
}
