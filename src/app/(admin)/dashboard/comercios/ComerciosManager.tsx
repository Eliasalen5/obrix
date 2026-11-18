"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminComercioApi,
  type ComercioAdmin,
  type SuscripcionComercio,
} from "@/lib/api/adminComercioClient";
import { PLANES, PLAN_IDS, getPlan, type PlanId } from "@/lib/planes";
import {
  Alert,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Field,
  Input,
  Select,
  SkeletonRows,
  Textarea,
  type BadgeTone,
} from "@/components/ui";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short" });

const PLAN_TONE: Record<string, BadgeTone> = {
  INICIAL: "neutral",
  COMERCIO: "info",
  PROFESIONAL: "orange",
};

const TH =
  "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500";
const TD = "px-4 py-3 align-middle text-sm text-obrix-black";

type Form = { plan: PlanId; motivo: string; planVence: string };

export default function ComerciosManager() {
  const [comercios, setComercios] = useState<ComercioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<
    { tipo: "ok" | "error"; texto: string } | null
  >(null);
  const [busqueda, setBusqueda] = useState("");

  const [seleccionado, setSeleccionado] = useState<ComercioAdmin | null>(null);
  const [form, setForm] = useState<Form>({
    plan: "INICIAL",
    motivo: "",
    planVence: "",
  });
  const [historial, setHistorial] = useState<SuscripcionComercio[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await adminComercioApi.listar();
    if (res.ok) setComercios(res.data);
    else setMensaje({ tipo: "error", texto: res.error });
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrir = useCallback(async (comercio: ComercioAdmin) => {
    setSeleccionado(comercio);
    setForm({
      plan: getPlan(comercio.plan).id,
      motivo: "",
      planVence: comercio.planVence
        ? new Date(comercio.planVence).toISOString().slice(0, 10)
        : "",
    });
    setHistorial([]);
    setCargandoHistorial(true);
    const res = await adminComercioApi.listarSuscripciones(comercio.id);
    if (res.ok) setHistorial(res.data);
    setCargandoHistorial(false);
  }, []);

  const cerrar = useCallback(() => {
    setSeleccionado(null);
    setHistorial([]);
  }, []);

  const guardar = useCallback(async () => {
    if (!seleccionado) return;
    setGuardando(true);
    setMensaje(null);
    const res = await adminComercioApi.asignarPlan(seleccionado.id, {
      plan: form.plan,
      motivo: form.motivo,
      planVence: form.planVence,
    });
    setGuardando(false);
    if (!res.ok) {
      setMensaje({
        tipo: "error",
        texto: res.details?.length
          ? `${res.error}: ${res.details.map((d) => d.message).join(" | ")}`
          : res.error,
      });
      return;
    }
    setMensaje({
      tipo: "ok",
      texto: `Plan de ${seleccionado.nombre} actualizado a ${getPlan(form.plan).nombre}`,
    });
    await cargar();
    cerrar();
  }, [seleccionado, form, cargar, cerrar]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return comercios;
    return comercios.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.owner.email.toLowerCase().includes(q) ||
        c.owner.nombre.toLowerCase().includes(q),
    );
  }, [comercios, busqueda]);

  const planDetalle = getPlan(form.plan);

  return (
    <div className="space-y-5">
      {mensaje ? (
        <Alert tone={mensaje.tipo === "ok" ? "success" : "error"}>
          {mensaje.texto}
        </Alert>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3">
          <Input
            placeholder="Buscar por comercio o titular"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="max-w-xs"
          />
          <span className="ml-auto text-xs text-neutral-500">
            {filtrados.length} de {comercios.length}
          </span>
        </div>

        {cargando ? (
          <SkeletonRows rows={5} />
        ) : comercios.length === 0 ? (
          <EmptyState
            className="m-5 border-0 bg-transparent"
            title="Sin comercios registrados"
            description="Los comercios aparecen cuando se aprueba su alta."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="bg-obrix-gray/60">
                <tr>
                  <th className={TH}>Comercio</th>
                  <th className={TH}>Estado</th>
                  <th className={TH}>Plan</th>
                  <th className={TH}>Productos</th>
                  <th className={TH}>Pedidos</th>
                  <th className={TH} />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => {
                  const plan = getPlan(c.plan);
                  return (
                    <tr key={c.id} className="border-t border-neutral-100">
                      <td className={TD}>
                        <p className="font-medium">{c.nombre}</p>
                        <p className="text-xs text-neutral-500">
                          {c.owner.nombre} · {c.owner.email}
                        </p>
                      </td>
                      <td className={TD}>
                        <Badge tone={c.activo ? "success" : "danger"} dot>
                          {c.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className={TD}>
                        <Badge tone={PLAN_TONE[plan.id] ?? "neutral"}>
                          {plan.nombre}
                        </Badge>
                        <p className="mt-1 text-xs text-neutral-500">
                          {plan.comisionPct}% comisión
                        </p>
                      </td>
                      <td className={TD}>{c._count.ofertas}</td>
                      <td className={TD}>{c._count.pedidos}</td>
                      <td className={`${TD} text-right`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void abrir(c)}
                        >
                          Cambiar plan
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={Boolean(seleccionado)}
        onClose={cerrar}
        title="Cambiar plan"
        description={seleccionado?.nombre}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cerrar}>
              Cancelar
            </Button>
            <Button loading={guardando} onClick={() => void guardar()}>
              Guardar plan
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="Plan" required>
            <Select
              value={form.plan}
              onChange={(e) =>
                setForm({ ...form, plan: e.target.value as PlanId })
              }
            >
              {PLAN_IDS.map((id) => (
                <option key={id} value={id}>
                  {PLANES[id].nombre}
                </option>
              ))}
            </Select>
          </Field>

          <div className="rounded-xl border border-neutral-200 bg-obrix-gray/60 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Precio mensual</span>
              <span className="font-medium">
                {planDetalle.precioMensual === 0
                  ? "Gratis"
                  : money.format(planDetalle.precioMensual)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-neutral-500">Comisión</span>
              <span className="font-medium">{planDetalle.comisionPct}%</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-neutral-500">Límite de productos</span>
              <span className="font-medium">
                {planDetalle.limiteProductos ?? "Ilimitados"}
              </span>
            </div>
          </div>

          <Field label="Vencimiento (opcional)" hint="Facturación manual.">
            <Input
              type="date"
              value={form.planVence}
              onChange={(e) => setForm({ ...form, planVence: e.target.value })}
            />
          </Field>

          <Field label="Motivo (opcional)">
            <Textarea
              rows={2}
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </Field>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Historial
            </p>
            {cargandoHistorial ? (
              <SkeletonRows rows={2} />
            ) : historial.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">
                Sin suscripciones registradas.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                {historial.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium">
                        {getPlan(s.plan).nombre}
                      </span>
                      <span className="block text-xs text-neutral-500">
                        {fecha.format(new Date(s.inicio))}
                        {s.fin ? ` → ${fecha.format(new Date(s.fin))}` : ""}
                      </span>
                    </span>
                    <Badge tone={s.estado === "ACTIVA" ? "success" : "neutral"}>
                      {s.estado}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
