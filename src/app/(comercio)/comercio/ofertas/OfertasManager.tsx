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

type Mensaje = { tipo: "ok" | "error" | "aviso"; texto: string };

type AltaForm = { precio: string; stock: string; marca: string };
type EditForm = {
  precio: string;
  stock: string;
  marca: string;
  activo: boolean;
};

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
  VINCULADA: "Vinculada a producto existente",
  RECHAZADA: "Rechazada",
};

const inputCls =
  "rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function issuesToText(error: ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "campo"}: ${i.message}`)
    .join(" | ");
}

function aNumero(valor: string): number {
  return Number(valor);
}

const PAGE_SIZE = 50;

export default function OfertasManager() {
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
    busqueda.trim() !== "" ||
    filtroCategoria !== "" ||
    filtroSubcategoria !== "";

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

  const activar = useCallback(
    async (productoId: string) => {
      const parsed = createOfertaSchema.safeParse({
        productoId,
        precio: aNumero(alta.precio),
        stock: aNumero(alta.stock),
        marca: alta.marca,
      });
      if (!parsed.success) {
        setMensaje({ tipo: "error", texto: issuesToText(parsed.error) });
        return;
      }
      const ok = await reportar(
        ofertaApi.upsertOferta(parsed.data),
        "Oferta activada",
      );
      if (ok) {
        setAltaId(null);
        setAlta(ALTA_VACIA);
      }
    },
    [alta, reportar],
  );

  const abrirEdicion = useCallback((o: Oferta) => {
    setEditId(o.id);
    setEdit({
      precio: String(o.precio),
      stock: String(o.stock),
      marca: o.marca,
      activo: o.activo,
    });
  }, []);

  const guardarEdicion = useCallback(
    async (id: string) => {
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
      const ok = await reportar(
        ofertaApi.updateOferta(id, parsed.data),
        "Oferta actualizada",
      );
      if (ok) setEditId(null);
    },
    [edit, reportar],
  );

  const eliminar = useCallback(
    async (id: string) => {
      await reportar(ofertaApi.deleteOferta(id), "Oferta eliminada");
    },
    [reportar],
  );

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

  return (
    <div className="mt-4 space-y-6">
      {mensaje && (
        <p
          className={
            mensaje.tipo === "ok"
              ? "text-sm text-green-600"
              : mensaje.tipo === "aviso"
                ? "text-sm text-amber-600"
                : "text-sm text-red-600"
          }
        >
          {mensaje.texto}
        </p>
      )}

      <section>
        <h2 className="text-lg font-medium">
          Ofertas activas ({ofertas.length})
        </h2>
        <input
          className={`${inputCls} mt-2`}
          placeholder="Buscar por producto, SKU o marca"
          value={busquedaOfertas}
          onChange={(e) => setBusquedaOfertas(e.target.value)}
        />
        {cargando ? (
          <p className="mt-2 text-sm text-gray-500">Cargando…</p>
        ) : ofertas.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Todavía no activaste productos.
          </p>
        ) : ofertasVisibles.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Sin resultados para esa búsqueda.
          </p>
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1 pr-2">Producto</th>
                <th className="py-1 pr-2">Precio</th>
                <th className="py-1 pr-2">Stock</th>
                <th className="py-1 pr-2">Marca</th>
                <th className="py-1 pr-2">Activo</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {ofertasVisibles.map((o) =>
                editId === o.id ? (
                  <tr key={o.id} className="border-b">
                    <td className="py-1 pr-2">
                      {o.producto?.nombre ?? o.productoId}
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={edit.precio}
                        onChange={(e) =>
                          setEdit({ ...edit, precio: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        className={inputCls}
                        inputMode="numeric"
                        value={edit.stock}
                        onChange={(e) =>
                          setEdit({ ...edit, stock: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        className={inputCls}
                        value={edit.marca}
                        onChange={(e) =>
                          setEdit({ ...edit, marca: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="checkbox"
                        checked={edit.activo}
                        onChange={(e) =>
                          setEdit({ ...edit, activo: e.target.checked })
                        }
                      />
                    </td>
                    <td className="py-1">
                      <button
                        onClick={() => void guardarEdicion(o.id)}
                        className="mr-2 text-blue-600"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="text-gray-500"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={o.id} className="border-b">
                    <td className="py-1 pr-2">
                      {o.producto?.nombre ?? o.productoId}
                    </td>
                    <td className="py-1 pr-2">{o.precio}</td>
                    <td className="py-1 pr-2">{o.stock === -1 ? "—" : o.stock}</td>
                    <td className="py-1 pr-2">{o.marca || "—"}</td>
                    <td className="py-1 pr-2">{o.activo ? "Sí" : "No"}</td>
                    <td className="py-1">
                      <button
                        onClick={() => abrirEdicion(o)}
                        className="mr-2 text-blue-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => void eliminar(o.id)}
                        className="text-red-600"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">
            Catálogo maestro ({totalProductos})
          </h2>
          <button
            type="button"
            onClick={abrirPropuesta}
            className="rounded border border-blue-600 px-3 py-1 text-sm text-blue-600"
          >
            + Proponer producto nuevo
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            className={`${inputCls} min-w-56`}
            placeholder="Buscar por nombre, SKU, marca o unidad"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setOffset(0);
            }}
          />
          <select
            className={inputCls}
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setFiltroSubcategoria("");
              setOffset(0);
            }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            className={inputCls}
            value={filtroSubcategoria}
            onChange={(e) => {
              setFiltroSubcategoria(e.target.value);
              setOffset(0);
            }}
            disabled={!filtroCategoria}
          >
            <option value="">Todas las subcategorías</option>
            {subcategoriasDe(filtroCategoria).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            Mostrando {productos.length} de {totalProductos}
          </span>
          {hayFiltroCatalogo && (
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setFiltroCategoria("");
                setFiltroSubcategoria("");
                setOffset(0);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 pr-2">SKU</th>
              <th className="py-1 pr-2">Producto</th>
              <th className="py-1 pr-2">Subcategoría</th>
              <th className="py-1 pr-2">Estado</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const yaActivado = ofertaPorProducto.has(p.id);
              return altaId === p.id ? (
                <tr key={p.id} className="border-b">
                  <td className="py-1 pr-2">{p.sku}</td>
                  <td className="py-1 pr-2">{p.nombre}</td>
                  <td className="py-1 pr-2">{p.subcategoria?.nombre ?? "—"}</td>
                  <td className="py-1 pr-2">
                    <input
                      placeholder="Precio"
                      className={inputCls}
                      inputMode="decimal"
                      value={alta.precio}
                      onChange={(e) =>
                        setAlta({ ...alta, precio: e.target.value })
                      }
                    />
                    <input
                      placeholder="Stock"
                      className={`${inputCls} ml-2`}
                      inputMode="numeric"
                      value={alta.stock}
                      onChange={(e) =>
                        setAlta({ ...alta, stock: e.target.value })
                      }
                    />
                    <input
                      placeholder="Marca"
                      className={`${inputCls} ml-2`}
                      value={alta.marca}
                      onChange={(e) =>
                        setAlta({ ...alta, marca: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-1">
                    <button
                      onClick={() => void activar(p.id)}
                      className="mr-2 text-blue-600"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setAltaId(null);
                        setAlta(ALTA_VACIA);
                      }}
                      className="text-gray-500"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-b">
                  <td className="py-1 pr-2">{p.sku}</td>
                  <td className="py-1 pr-2">{p.nombre}</td>
                  <td className="py-1 pr-2">{p.subcategoria?.nombre ?? "—"}</td>
                  <td className="py-1 pr-2">{yaActivado ? "Activado" : "—"}</td>
                  <td className="py-1">
                    {yaActivado ? (
                      <span className="text-gray-400">Ya activado</span>
                    ) : (
                      <button
                        onClick={() => {
                          setAltaId(p.id);
                          setAlta(ALTA_VACIA);
                        }}
                        className="text-blue-600"
                      >
                        Activar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {productos.length === 0 && !cargandoCatalogo && (
              <tr>
                <td colSpan={5} className="py-2 text-gray-500">
                  {hayFiltroCatalogo ? (
                    <span>
                      Sin resultados para esa búsqueda.{" "}
                      <button
                        type="button"
                        onClick={abrirPropuesta}
                        className="text-blue-600 hover:underline"
                      >
                        ¿Proponer &quot;{busqueda}&quot; al catálogo?
                      </button>
                    </span>
                  ) : (
                    "Sin productos."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            disabled={offset === 0 || cargandoCatalogo}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            Anterior
          </button>
          <span className="text-gray-500">
            Página {Math.floor(offset / PAGE_SIZE) + 1} de{" "}
            {Math.max(1, Math.ceil(totalProductos / PAGE_SIZE))}
          </span>
          <button
            type="button"
            disabled={offset + PAGE_SIZE >= totalProductos || cargandoCatalogo}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            Siguiente
          </button>
          {cargandoCatalogo && (
            <span className="text-gray-500">Cargando catálogo…</span>
          )}
        </div>

        {propuestaAbierta && (
          <div className="mt-4 rounded border border-zinc-300 p-4 dark:border-zinc-700">
            <h3 className="text-base font-medium">Proponer producto nuevo</h3>
            <p className="mt-1 text-sm text-gray-600">
              Se enviará al administrador para su revisión. No se publica hasta
              ser aprobado.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex flex-col text-sm">
                Nombre *
                <input
                  className={inputCls}
                  value={propuesta.nombre}
                  onChange={(e) =>
                    setPropuesta({ ...propuesta, nombre: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col text-sm">
                Categoría *
                <select
                  className={inputCls}
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
                </select>
              </label>
              <label className="flex flex-col text-sm">
                Subcategoría
                <select
                  className={inputCls}
                  value={propuesta.subcategoriaId}
                  onChange={(e) =>
                    setPropuesta({
                      ...propuesta,
                      subcategoriaId: e.target.value,
                    })
                  }
                  disabled={!propuesta.categoriaId}
                >
                  <option value="">Sin subcategoría</option>
                  {subcategoriasDe(propuesta.categoriaId).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm">
                Presentación / medida * (ej: bolsa 50 kg)
                <input
                  className={inputCls}
                  value={propuesta.unidad}
                  onChange={(e) =>
                    setPropuesta({ ...propuesta, unidad: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col text-sm">
                Marca
                <input
                  className={inputCls}
                  value={propuesta.marca}
                  onChange={(e) =>
                    setPropuesta({ ...propuesta, marca: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col text-sm">
                Fabricante
                <input
                  className={inputCls}
                  value={propuesta.fabricante}
                  onChange={(e) =>
                    setPropuesta({ ...propuesta, fabricante: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col text-sm">
                Código de barras
                <input
                  className={inputCls}
                  value={propuesta.codigoBarras}
                  onChange={(e) =>
                    setPropuesta({ ...propuesta, codigoBarras: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col text-sm">
                Código de fabricante
                <input
                  className={inputCls}
                  value={propuesta.codigoFabricante}
                  onChange={(e) =>
                    setPropuesta({
                      ...propuesta,
                      codigoFabricante: e.target.value,
                    })
                  }
                />
              </label>
              <label className="flex flex-col text-sm">
                Imagen (URL, opcional)
                <input
                  className={inputCls}
                  value={propuesta.imagenUrl}
                  onChange={(e) =>
                    setPropuesta({ ...propuesta, imagenUrl: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col text-sm">
                Precio inicial *
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={propuesta.precio}
                  onChange={(e) =>
                    setPropuesta({ ...propuesta, precio: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col text-sm">
                Stock inicial
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={propuesta.stock}
                  onChange={(e) =>
                    setPropuesta({ ...propuesta, stock: e.target.value })
                  }
                />
              </label>
            </div>
            <label className="mt-2 flex flex-col text-sm">
              Descripción (opcional)
              <textarea
                className={inputCls}
                rows={2}
                value={propuesta.descripcion}
                onChange={(e) =>
                  setPropuesta({ ...propuesta, descripcion: e.target.value })
                }
              />
            </label>
            <div className="mt-3">
              <button
                type="button"
                disabled={enviandoPropuesta}
                onClick={() => void enviarPropuesta()}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                {enviandoPropuesta ? "Enviando…" : "Enviar solicitud"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPropuestaAbierta(false);
                  setPropuesta(PROPUESTA_VACIA);
                }}
                className="ml-2 text-sm text-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium">
          Mis solicitudes ({solicitudes.length})
        </h2>
        {cargando ? (
          <p className="mt-2 text-sm text-gray-500">Cargando…</p>
        ) : solicitudes.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Todavía no propusiste productos.
          </p>
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1 pr-2">Producto propuesto</th>
                <th className="py-1 pr-2">Presentación</th>
                <th className="py-1 pr-2">Estado</th>
                <th className="py-1 pr-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-1 pr-2">{s.datos.nombre}</td>
                  <td className="py-1 pr-2">{s.datos.unidad}</td>
                  <td className="py-1 pr-2">{ESTADO_LABEL[s.estado]}</td>
                  <td className="py-1 pr-2 text-gray-500">
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
        )}
      </section>
    </div>
  );
}
