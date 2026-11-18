"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ZodError } from "zod";
import {
  ofertaApi,
  type ApiResult,
  type Categoria,
  type Oferta,
  type Producto,
} from "@/lib/api/ofertaClient";
import {
  solicitudComercioApi,
  type EstadoSolicitud,
  type SolicitudProducto,
} from "@/lib/api/solicitudClient";
import {
  createOfertaSchema,
  updateOfertaSchema,
} from "@/lib/validators/oferta";
import {
  propuestaProductoSchema,
  type PropuestaProductoInput,
} from "@/lib/validators/solicitud";
import { normalizarTexto } from "@/lib/text/busqueda";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  Pagination,
  Select,
  SkeletonRows,
  Tabs,
  Textarea,
  type BadgeTone,
  type TabItem,
} from "@/components/ui";

type Mensaje = { tipo: "ok" | "error" | "aviso"; texto: string };
type TabId = "productos" | "catalogo" | "propuestas";

type AltaForm = { precio: string; stock: string; marca: string };
type EditForm = { precio: string; stock: string; marca: string; activo: boolean };
type PropuestaForm = {
  nombre: string;
  categoriaId: string;
  subcategoriaId: string;
  unidad: string;
  marca: string;
  fabricante: string;
  codigoBarras: string;
  codigoFabricante: string;
  descripcion: string;
  imagenUrl: string;
  precio: string;
  stock: string;
};

const ALTA_VACIA: AltaForm = { precio: "", stock: "0", marca: "" };
const EDIT_VACIO: EditForm = { precio: "", stock: "", marca: "", activo: true };
const PROPUESTA_VACIA: PropuestaForm = {
  nombre: "",
  categoriaId: "",
  subcategoriaId: "",
  unidad: "",
  marca: "",
  fabricante: "",
  codigoBarras: "",
  codigoFabricante: "",
  descripcion: "",
  imagenUrl: "",
  precio: "",
  stock: "0",
};

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  PENDIENTE_REVISION: "Pendiente de revisión",
  APROBADA: "Aprobada",
  VINCULADA: "Vinculada",
  RECHAZADA: "Rechazada",
};

const ESTADO_TONE: Record<EstadoSolicitud, BadgeTone> = {
  PENDIENTE_REVISION: "warning",
  APROBADA: "success",
  VINCULADA: "info",
  RECHAZADA: "danger",
};

const PAGE_SIZE = 50;

function issuesToText(error: ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "campo"}: ${i.message}`)
    .join(" | ");
}

function aNumero(valor: string): number {
  return Number(valor);
}

const TH =
  "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500";
const TD = "px-4 py-3 align-middle text-sm text-obrix-black";

export default function OfertasManager() {
  const [tab, setTab] = useState<TabId>("productos");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [totalProductos, setTotalProductos] = useState(0);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudProducto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("");
  const [offset, setOffset] = useState(0);
  const [busquedaOfertas, setBusquedaOfertas] = useState("");

  const [altaId, setAltaId] = useState<string | null>(null);
  const [alta, setAlta] = useState<AltaForm>(ALTA_VACIA);

  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditForm>(EDIT_VACIO);

  const [propuestaAbierta, setPropuestaAbierta] = useState(false);
  const [propuesta, setPropuesta] = useState<PropuestaForm>(PROPUESTA_VACIA);
  const [enviandoPropuesta, setEnviandoPropuesta] = useState(false);

  const [aEliminar, setAEliminar] = useState<Oferta | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargarOfertas = useCallback(async () => {
    const res = await ofertaApi.listOfertas();
    if (res.ok) setOfertas(res.data);
    else setMensaje({ tipo: "error", texto: res.error });
  }, []);

  const cargarSolicitudes = useCallback(async () => {
    const res = await solicitudComercioApi.listSolicitudes();
    if (res.ok) setSolicitudes(res.data);
    else setMensaje({ tipo: "error", texto: res.error });
  }, []);

  const cargarCategorias = useCallback(async () => {
    const res = await ofertaApi.listCategorias();
    if (res.ok) setCategorias(res.data);
    else setMensaje({ tipo: "error", texto: res.error });
  }, []);

  const cargarCatalogo = useCallback(
    async (signal?: AbortSignal) => {
      setCargandoCatalogo(true);
      const res = await ofertaApi.listCatalogo({
        q: busquedaDebounced,
        categoriaId: filtroCategoria,
        subcategoriaId: filtroSubcategoria,
        limit: PAGE_SIZE,
        offset,
        signal,
      });
      if (signal?.aborted) return;
      if (res.ok) {
        setProductos(res.data.productos);
        setTotalProductos(res.data.total);
      } else if (res.status !== 0) {
        setMensaje({ tipo: "error", texto: res.error });
      }
      setCargandoCatalogo(false);
    },
    [busquedaDebounced, filtroCategoria, filtroSubcategoria, offset],
  );

  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda.trim()), 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    const controller = new AbortController();
    void cargarCatalogo(controller.signal);
    return () => controller.abort();
  }, [cargarCatalogo]);

  useEffect(() => {
    void Promise.all([
      cargarOfertas(),
      cargarSolicitudes(),
      cargarCategorias(),
    ]).finally(() => setCargando(false));
  }, [cargarOfertas, cargarSolicitudes, cargarCategorias]);

  const recargar = useCallback(async () => {
    await Promise.all([cargarOfertas(), cargarSolicitudes()]);
  }, [cargarOfertas, cargarSolicitudes]);

  const ofertaPorProducto = useMemo(() => {
    const mapa = new Map<string, Oferta>();
    for (const o of ofertas) mapa.set(o.productoId, o);
    return mapa;
  }, [ofertas]);

  const subcategoriasDe = useCallback(
    (categoriaId: string) =>
      categorias.find((c) => c.id === categoriaId)?.subcategorias ?? [],
    [categorias],
  );

  const hayFiltroCatalogo =
    busqueda.trim() !== "" || filtroCategoria !== "" || filtroSubcategoria !== "";

  const ofertasVisibles = useMemo(() => {
    const q = normalizarTexto(busquedaOfertas);
    if (q === "") return ofertas;
    return ofertas.filter((o) =>
      normalizarTexto(
        `${o.producto?.nombre ?? ""} ${o.producto?.sku ?? ""} ${o.marca}`,
      ).includes(q),
    );
  }, [ofertas, busquedaOfertas]);

  const reportar = useCallback(
    async (promesa: Promise<ApiResult<unknown>>, exito: string) => {
      const res = await promesa;
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: exito });
        await recargar();
        return true;
      }
      setMensaje({
        tipo: "error",
        texto: res.details?.length
          ? `${res.error}: ${res.details.map((d) => d.message).join(" | ")}`
          : res.error,
      });
      return false;
    },
    [recargar],
  );

  const activar = useCallback(async () => {
    if (!altaId) return;
    const parsed = createOfertaSchema.safeParse({
      productoId: altaId,
      precio: aNumero(alta.precio),
      stock: aNumero(alta.stock),
      marca: alta.marca,
    });
    if (!parsed.success) {
      setMensaje({ tipo: "error", texto: issuesToText(parsed.error) });
      return;
    }
    setGuardando(true);
    const ok = await reportar(
      ofertaApi.upsertOferta(parsed.data),
      "Producto publicado",
    );
    setGuardando(false);
    if (ok) {
      setAltaId(null);
      setAlta(ALTA_VACIA);
    }
  }, [altaId, alta, reportar]);

  const abrirEdicion = useCallback((o: Oferta) => {
    setEditId(o.id);
    setEdit({
      precio: String(o.precio),
      stock: String(o.stock),
      marca: o.marca,
      activo: o.activo,
    });
  }, []);

  const guardarEdicion = useCallback(async () => {
    if (!editId) return;
    const parsed = updateOfertaSchema.safeParse({
      precio: aNumero(edit.precio),
      stock: aNumero(edit.stock),
      marca: edit.marca,
      activo: edit.activo,
    });
    if (!parsed.success) {
      setMensaje({ tipo: "error", texto: issuesToText(parsed.error) });
      return;
    }
    setGuardando(true);
    const ok = await reportar(
      ofertaApi.updateOferta(editId, parsed.data),
      "Producto actualizado",
    );
    setGuardando(false);
    if (ok) setEditId(null);
  }, [editId, edit, reportar]);

  const eliminar = useCallback(async () => {
    if (!aEliminar) return;
    setGuardando(true);
    await reportar(ofertaApi.deleteOferta(aEliminar.id), "Producto quitado");
    setGuardando(false);
    setAEliminar(null);
  }, [aEliminar, reportar]);

  const abrirPropuesta = useCallback(() => {
    setPropuesta({ ...PROPUESTA_VACIA, nombre: busqueda });
    setPropuestaAbierta(true);
    setMensaje(null);
  }, [busqueda]);

  const enviarPropuesta = useCallback(async () => {
    const candidata: PropuestaProductoInput = {
      nombre: propuesta.nombre,
      categoriaId: propuesta.categoriaId,
      subcategoriaId: propuesta.subcategoriaId,
      unidad: propuesta.unidad,
      marca: propuesta.marca,
      fabricante: propuesta.fabricante,
      codigoBarras: propuesta.codigoBarras,
      codigoFabricante: propuesta.codigoFabricante,
      descripcion: propuesta.descripcion,
      imagenUrl: propuesta.imagenUrl,
      atributos: {},
      precio: aNumero(propuesta.precio),
      stock: aNumero(propuesta.stock),
    };
    const parsed = propuestaProductoSchema.safeParse(candidata);
    if (!parsed.success) {
      setMensaje({ tipo: "error", texto: issuesToText(parsed.error) });
      return;
    }
    setEnviandoPropuesta(true);
    const res = await solicitudComercioApi.crearSolicitud(parsed.data);
    setEnviandoPropuesta(false);

    if (!res.ok) {
      setMensaje({
        tipo: "error",
        texto: res.details?.length
          ? `${res.error}: ${res.details.map((d) => d.message).join(" | ")}`
          : res.error,
      });
      return;
    }

    const posibles = res.data.posiblesDuplicados ?? [];
    setMensaje({
      tipo: posibles.length > 0 ? "aviso" : "ok",
      texto:
        posibles.length > 0
          ? `Solicitud enviada. Revisá estas posibles coincidencias antes de que el admin la apruebe: ${posibles
              .map((p) => p.nombre)
              .join(", ")}`
          : "Solicitud enviada. Quedó pendiente de revisión.",
    });
    setPropuestaAbierta(false);
    setPropuesta(PROPUESTA_VACIA);
    await recargar();
  }, [propuesta, recargar]);

  const productoAlta = productos.find((p) => p.id === altaId) ?? null;
  const ofertaEdicion = ofertas.find((o) => o.id === editId) ?? null;

  const tabs: ReadonlyArray<TabItem<TabId>> = [
    { id: "productos", label: "Mis productos", count: ofertas.length },
    { id: "catalogo", label: "Catálogo maestro", count: totalProductos },
    { id: "propuestas", label: "Mis propuestas", count: solicitudes.length },
  ];

  return (
    <div className="space-y-5">
      {mensaje ? (
        <Alert
          tone={
            mensaje.tipo === "ok"
              ? "success"
              : mensaje.tipo === "aviso"
                ? "warning"
                : "error"
          }
          action={
            <button
              type="button"
              onClick={() => setMensaje(null)}
              className="text-xs font-medium opacity-70 hover:opacity-100"
            >
              Cerrar
            </button>
          }
        >
          {mensaje.texto}
        </Alert>
      ) : null}

      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === "productos" ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <Input
              placeholder="Buscar por producto, SKU o marca"
              value={busquedaOfertas}
              onChange={(e) => setBusquedaOfertas(e.target.value)}
              className="max-w-xs"
            />
            <span className="text-xs text-neutral-500">
              {ofertas.length} publicados
            </span>
          </div>

          {cargando ? (
            <SkeletonRows rows={4} />
          ) : ofertas.length === 0 ? (
            <EmptyState
              className="m-5 border-0 bg-transparent"
              title="Todavía no publicaste productos"
              description="Activá productos del catálogo maestro para empezar a vender."
              action={
                <Button size="sm" onClick={() => setTab("catalogo")}>
                  Ir al catálogo
                </Button>
              }
            />
          ) : ofertasVisibles.length === 0 ? (
            <EmptyState
              className="m-5 border-0 bg-transparent"
              title="Sin resultados"
              description="No encontramos productos con esa búsqueda."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead className="bg-obrix-gray/60">
                  <tr>
                    <th className={TH}>Producto</th>
                    <th className={TH}>Precio</th>
                    <th className={TH}>Stock</th>
                    <th className={TH}>Marca</th>
                    <th className={TH}>Estado</th>
                    <th className={TH} />
                  </tr>
                </thead>
                <tbody>
                  {ofertasVisibles.map((o) => (
                    <tr key={o.id} className="border-t border-neutral-100">
                      <td className={TD}>
                        <p className="font-medium">
                          {o.producto?.nombre ?? o.productoId}
                        </p>
                        {o.producto?.sku ? (
                          <p className="text-xs text-neutral-500">
                            {o.producto.sku}
                          </p>
                        ) : null}
                      </td>
                      <td className={TD}>{o.precio}</td>
                      <td className={TD}>{o.stock === -1 ? "—" : o.stock}</td>
                      <td className={TD}>{o.marca || "—"}</td>
                      <td className={TD}>
                        <Badge tone={o.activo ? "success" : "neutral"} dot>
                          {o.activo ? "Activo" : "Pausado"}
                        </Badge>
                      </td>
                      <td className={`${TD} text-right`}>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirEdicion(o)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setAEliminar(o)}
                          >
                            Quitar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "catalogo" ? (
        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3">
            <Input
              placeholder="Buscar por nombre, SKU, marca o unidad"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setOffset(0);
              }}
              className="min-w-56 flex-1"
            />
            <Select
              value={filtroCategoria}
              onChange={(e) => {
                setFiltroCategoria(e.target.value);
                setFiltroSubcategoria("");
                setOffset(0);
              }}
              className="w-auto"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Select
              value={filtroSubcategoria}
              onChange={(e) => {
                setFiltroSubcategoria(e.target.value);
                setOffset(0);
              }}
              disabled={!filtroCategoria}
              className="w-auto"
            >
              <option value="">Todas las subcategorías</option>
              {subcategoriasDe(filtroCategoria).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
            {hayFiltroCatalogo ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setBusqueda("");
                  setFiltroCategoria("");
                  setFiltroSubcategoria("");
                  setOffset(0);
                }}
              >
                Limpiar
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              className="ml-auto"
              onClick={abrirPropuesta}
            >
              Proponer producto
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead className="bg-obrix-gray/60">
                <tr>
                  <th className={TH}>SKU</th>
                  <th className={TH}>Producto</th>
                  <th className={TH}>Subcategoría</th>
                  <th className={TH}>Estado</th>
                  <th className={TH} />
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const yaActivado = ofertaPorProducto.has(p.id);
                  return (
                    <tr key={p.id} className="border-t border-neutral-100">
                      <td className={`${TD} text-xs text-neutral-500`}>
                        {p.sku}
                      </td>
                      <td className={TD}>{p.nombre}</td>
                      <td className={`${TD} text-neutral-500`}>
                        {p.subcategoria?.nombre ?? "—"}
                      </td>
                      <td className={TD}>
                        {yaActivado ? (
                          <Badge tone="success" dot>
                            Publicado
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Disponible</Badge>
                        )}
                      </td>
                      <td className={`${TD} text-right`}>
                        {yaActivado ? (
                          <span className="text-xs text-neutral-400">
                            Ya publicado
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setAltaId(p.id);
                              setAlta(ALTA_VACIA);
                            }}
                          >
                            Publicar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {productos.length === 0 && !cargandoCatalogo ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
                      {hayFiltroCatalogo ? (
                        <span>
                          Sin resultados.{" "}
                          <button
                            type="button"
                            onClick={abrirPropuesta}
                            className="font-medium text-obrix-orange hover:underline"
                          >
                            ¿Proponer &quot;{busqueda}&quot; al catálogo?
                          </button>
                        </span>
                      ) : (
                        "Sin productos en el catálogo."
                      )}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
            <span className="text-xs text-neutral-500">
              Mostrando {productos.length} de {totalProductos}
            </span>
            <Pagination
              page={Math.floor(offset / PAGE_SIZE) + 1}
              pageCount={Math.max(1, Math.ceil(totalProductos / PAGE_SIZE))}
              onPrevious={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              onNext={() => setOffset(offset + PAGE_SIZE)}
              disabled={cargandoCatalogo}
            />
          </div>
        </Card>
      ) : null}

      {tab === "propuestas" ? (
        <Card>
          <div className="border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-obrix-black">
              Productos propuestos
            </h2>
            <p className="text-xs text-neutral-500">
              El administrador revisa cada propuesta antes de publicarla.
            </p>
          </div>
          {cargando ? (
            <SkeletonRows rows={3} />
          ) : solicitudes.length === 0 ? (
            <EmptyState
              className="m-5 border-0 bg-transparent"
              title="Todavía no propusiste productos"
              description="Si falta un producto en el catálogo, podés proponerlo desde la pestaña Catálogo."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead className="bg-obrix-gray/60">
                  <tr>
                    <th className={TH}>Producto</th>
                    <th className={TH}>Presentación</th>
                    <th className={TH}>Estado</th>
                    <th className={TH}>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => (
                    <tr key={s.id} className="border-t border-neutral-100">
                      <td className={TD}>{s.datos.nombre}</td>
                      <td className={`${TD} text-neutral-500`}>
                        {s.datos.unidad}
                      </td>
                      <td className={TD}>
                        <Badge tone={ESTADO_TONE[s.estado]}>
                          {ESTADO_LABEL[s.estado]}
                        </Badge>
                      </td>
                      <td className={`${TD} text-neutral-500`}>
                        {s.estado === "RECHAZADA"
                          ? s.motivoRechazo
                          : s.producto
                            ? `→ ${s.producto.nombre}`
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      <Drawer
        open={Boolean(altaId)}
        onClose={() => {
          setAltaId(null);
          setAlta(ALTA_VACIA);
        }}
        title="Publicar producto"
        description={productoAlta?.nombre}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAltaId(null);
                setAlta(ALTA_VACIA);
              }}
            >
              Cancelar
            </Button>
            <Button loading={guardando} onClick={() => void activar()}>
              Publicar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Precio" required htmlFor="alta-precio">
            <Input
              id="alta-precio"
              inputMode="decimal"
              placeholder="Ej: 12500"
              value={alta.precio}
              onChange={(e) => setAlta({ ...alta, precio: e.target.value })}
            />
          </Field>
          <Field
            label="Stock"
            hint="-1 = sin control de stock"
            htmlFor="alta-stock"
          >
            <Input
              id="alta-stock"
              inputMode="numeric"
              value={alta.stock}
              onChange={(e) => setAlta({ ...alta, stock: e.target.value })}
            />
          </Field>
          <Field label="Marca (opcional)" htmlFor="alta-marca">
            <Input
              id="alta-marca"
              value={alta.marca}
              onChange={(e) => setAlta({ ...alta, marca: e.target.value })}
            />
          </Field>
        </div>
      </Drawer>

      <Drawer
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        title="Editar producto"
        description={ofertaEdicion?.producto?.nombre}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditId(null)}>
              Cancelar
            </Button>
            <Button loading={guardando} onClick={() => void guardarEdicion()}>
              Guardar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Precio" required htmlFor="edit-precio">
            <Input
              id="edit-precio"
              inputMode="decimal"
              value={edit.precio}
              onChange={(e) => setEdit({ ...edit, precio: e.target.value })}
            />
          </Field>
          <Field label="Stock" hint="-1 = sin control" htmlFor="edit-stock">
            <Input
              id="edit-stock"
              inputMode="numeric"
              value={edit.stock}
              onChange={(e) => setEdit({ ...edit, stock: e.target.value })}
            />
          </Field>
          <Field label="Marca" htmlFor="edit-marca">
            <Input
              id="edit-marca"
              value={edit.marca}
              onChange={(e) => setEdit({ ...edit, marca: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-obrix-black">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-obrix-orange focus:ring-obrix-orange"
              checked={edit.activo}
              onChange={(e) => setEdit({ ...edit, activo: e.target.checked })}
            />
            Producto activo (visible para clientes)
          </label>
        </div>
      </Drawer>

      <Drawer
        open={propuestaAbierta}
        onClose={() => {
          setPropuestaAbierta(false);
          setPropuesta(PROPUESTA_VACIA);
        }}
        title="Proponer producto nuevo"
        description="Se envía al administrador para su revisión."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPropuestaAbierta(false);
                setPropuesta(PROPUESTA_VACIA);
              }}
            >
              Cancelar
            </Button>
            <Button
              loading={enviandoPropuesta}
              onClick={() => void enviarPropuesta()}
            >
              Enviar solicitud
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" required className="sm:col-span-2">
            <Input
              value={propuesta.nombre}
              onChange={(e) =>
                setPropuesta({ ...propuesta, nombre: e.target.value })
              }
            />
          </Field>
          <Field label="Categoría" required>
            <Select
              value={propuesta.categoriaId}
              onChange={(e) =>
                setPropuesta({
                  ...propuesta,
                  categoriaId: e.target.value,
                  subcategoriaId: "",
                })
              }
            >
              <option value="">Elegí una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subcategoría">
            <Select
              value={propuesta.subcategoriaId}
              onChange={(e) =>
                setPropuesta({ ...propuesta, subcategoriaId: e.target.value })
              }
              disabled={!propuesta.categoriaId}
            >
              <option value="">Sin subcategoría</option>
              {subcategoriasDe(propuesta.categoriaId).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Presentación / medida" required hint="Ej: bolsa 50 kg">
            <Input
              value={propuesta.unidad}
              onChange={(e) =>
                setPropuesta({ ...propuesta, unidad: e.target.value })
              }
            />
          </Field>
          <Field label="Marca">
            <Input
              value={propuesta.marca}
              onChange={(e) =>
                setPropuesta({ ...propuesta, marca: e.target.value })
              }
            />
          </Field>
          <Field label="Fabricante">
            <Input
              value={propuesta.fabricante}
              onChange={(e) =>
                setPropuesta({ ...propuesta, fabricante: e.target.value })
              }
            />
          </Field>
          <Field label="Código de barras">
            <Input
              value={propuesta.codigoBarras}
              onChange={(e) =>
                setPropuesta({ ...propuesta, codigoBarras: e.target.value })
              }
            />
          </Field>
          <Field label="Código de fabricante">
            <Input
              value={propuesta.codigoFabricante}
              onChange={(e) =>
                setPropuesta({ ...propuesta, codigoFabricante: e.target.value })
              }
            />
          </Field>
          <Field label="Imagen (URL, opcional)" className="sm:col-span-2">
            <Input
              value={propuesta.imagenUrl}
              onChange={(e) =>
                setPropuesta({ ...propuesta, imagenUrl: e.target.value })
              }
            />
          </Field>
          <Field label="Precio inicial" required>
            <Input
              inputMode="decimal"
              value={propuesta.precio}
              onChange={(e) =>
                setPropuesta({ ...propuesta, precio: e.target.value })
              }
            />
          </Field>
          <Field label="Stock inicial">
            <Input
              inputMode="numeric"
              value={propuesta.stock}
              onChange={(e) =>
                setPropuesta({ ...propuesta, stock: e.target.value })
              }
            />
          </Field>
          <Field label="Descripción (opcional)" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={propuesta.descripcion}
              onChange={(e) =>
                setPropuesta({ ...propuesta, descripcion: e.target.value })
              }
            />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(aEliminar)}
        title="Quitar producto"
        description={
          aEliminar
            ? `Se quitará "${aEliminar.producto?.nombre ?? "el producto"}" de tus publicaciones.`
            : undefined
        }
        confirmLabel="Quitar"
        danger
        loading={guardando}
        onConfirm={() => void eliminar()}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  );
}
