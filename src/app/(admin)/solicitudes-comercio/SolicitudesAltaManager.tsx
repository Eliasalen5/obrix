"use client";

import { useCallback, useEffect, useState } from "react";
import { request } from "@/lib/api/httpClient";

type SolicitudAlta = {
  id: string;
  estado: string;
  nombreFantasia: string;
  razonSocial: string;
  cuit: string;
  direccion: string;
  provincia: string;
  localidad: string;
  lat: number;
  lng: number;
  telefonoComercial: string;
  telefonoTitular: string;
  rubro: string;
  categorias: unknown;
  motivoRechazo: string;
  createdAt: string;
  solicitante: { id: string; email: string; nombre: string; createdAt: string };
  revisadoBy?: { id: string; nombre: string; email: string } | null;
  comercio?: { id: string; activo: boolean } | null;
};

type Mensaje = { tipo: "ok" | "error"; texto: string };

export default function SolicitudesAltaManager() {
  const [solicitudes, setSolicitudes] = useState<SolicitudAlta[]>([]);
  const [filtro, setFiltro] = useState<string>("PENDIENTE");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [rechazandoId, setRechazandoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await request<SolicitudAlta[]>(`/api/v1/admin/solicitudes-alta${filtro ? `?estado=${filtro}` : ""}`);
    if (res.ok) setSolicitudes(res.data);
    else setMensaje({ tipo: "error", texto: res.error });
    setCargando(false);
  }, [filtro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function aprobar(id: string) {
    setMensaje(null);
    const res = await request(`/api/v1/admin/solicitudes-alta/${id}/aprobar`, { method: "POST" });
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: "Solicitud aprobada. Se creó el comercio y se asignó rol COMERCIO." });
      await cargar();
    } else {
      setMensaje({ tipo: "error", texto: res.error });
    }
  }

  async function rechazar(id: string) {
    if (!motivo.trim() || motivo.trim().length < 5) {
      setMensaje({ tipo: "error", texto: "El motivo debe tener al menos 5 caracteres" });
      return;
    }
    setMensaje(null);
    const res = await request(`/api/v1/admin/solicitudes-alta/${id}/rechazar`, {
      method: "POST",
      body: JSON.stringify({ motivo: motivo.trim() }),
    });
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: "Solicitud rechazada" });
      setRechazandoId(null);
      setMotivo("");
      await cargar();
    } else {
      setMensaje({ tipo: "error", texto: res.error });
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {mensaje && (
        <div
          className={`rounded border px-3 py-2 text-sm ${
            mensaje.tipo === "ok"
              ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="PENDIENTE">Pendientes</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="RECHAZADA">Rechazadas</option>
          <option value="">Todas</option>
        </select>
        <button type="button" onClick={() => void cargar()} className="text-sm text-blue-600 hover:underline">
          Refrescar
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : solicitudes.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin solicitudes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Comercio</th>
                <th className="py-2 pr-3">Titular</th>
                <th className="py-2 pr-3">Contacto</th>
                <th className="py-2 pr-3">Ubicación</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-3 text-zinc-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-3">
                    <div className="font-medium">{s.nombreFantasia}</div>
                    {s.razonSocial ? <div className="text-xs text-zinc-500">{s.razonSocial}</div> : null}
                    {s.cuit ? <div className="text-xs text-zinc-500">CUIT: {s.cuit}</div> : null}
                    {s.rubro ? <div className="text-xs text-zinc-500">Rubro: {s.rubro}</div> : null}
                  </td>
                  <td className="py-2 pr-3">
                    <div>{s.solicitante.nombre}</div>
                    <div className="text-xs text-zinc-500">{s.solicitante.email}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <div>Tel. titular: {s.telefonoTitular}</div>
                    <div>Tel. comercio: {s.telefonoComercial}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <div>{s.direccion}</div>
                    {(s.localidad || s.provincia) && (
                      <div className="text-xs text-zinc-500">
                        {[s.localidad, s.provincia].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div className="text-xs text-zinc-500">
                      {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="rounded px-2 py-0.5 text-xs">{s.estado}</span>
                    {s.estado === "RECHAZADA" && s.motivoRechazo ? (
                      <div className="mt-1 max-w-xs text-xs text-red-600">{s.motivoRechazo}</div>
                    ) : null}
                    {s.revisadoBy ? (
                      <div className="mt-1 text-xs text-zinc-500">Por {s.revisadoBy.nombre}</div>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3">
                    {s.estado === "PENDIENTE" ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => void aprobar(s.id)}
                          className="text-left text-sm text-green-600 hover:underline"
                        >
                          Aprobar
                        </button>
                        {rechazandoId === s.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                              rows={3}
                              placeholder="Motivo del rechazo (mínimo 5 caracteres)"
                              value={motivo}
                              onChange={(e) => setMotivo(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void rechazar(s.id)}
                                className="text-sm text-red-600 hover:underline"
                              >
                                Confirmar rechazo
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRechazandoId(null);
                                  setMotivo("");
                                }}
                                className="text-sm text-zinc-500 hover:underline"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRechazandoId(s.id)}
                            className="text-left text-sm text-red-600 hover:underline"
                          >
                            Rechazar
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">Resuelta</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
