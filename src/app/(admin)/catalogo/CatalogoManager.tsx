"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { ZodError } from "zod";
import {
  catalogoApi,
  type ApiResult,
  type Categoria,
  type Producto,
} from "@/lib/api/catalogoClient";
import {
  createCategoriaSchema,
  createProductoSchema,
} from "@/lib/validators/catalogo";
import { normalizarTexto } from "@/lib/services/cotizador.service";

type Mensaje = { tipo: "ok" | "error"; texto: string };

const VACIO_CAT = { nombre: "", orden: "0" };
const VACIO_PROD = {
  sku: "",
  nombre: "",
  unidad: "",
  descripcion: "",
  categoriaId: "",
};

type CatForm = typeof VACIO_CAT;
type ProdForm = typeof VACIO_PROD;

function issuesToText(error: ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "campo"}: ${i.message}`)
    .join(" | ");
}

const inputCls =
  "rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function CatalogoManager() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const [catForm, setCatForm] = useState<CatForm>(VACIO_CAT);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catEdit, setCatEdit] = useState<CatForm>(VACIO_CAT);

  const [prodForm, setProdForm] = useState<ProdForm>(VACIO_PROD);
  const [prodEditId, setProdEditId] = useState<string | null>(null);
  const [prodEdit, setProdEdit] = useState<ProdForm>(VACIO_PROD);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [cats, prods] = await Promise.all([
      catalogoApi.listCategorias(),
      catalogoApi.listProductos(),
    ]);
    if (cats.ok) setCategorias(cats.data);
    else setMensaje({ tipo: "error", texto: cats.error });
    if (prods.ok) setProductos(prods.data);
    else setMensaje({ tipo: "error", texto: prods.error });
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const reportar = useCallback(
    async (promesa: Promise<ApiResult<unknown>>, exito: string) => {
      const res = await promesa;
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: exito });
        await cargar();
        return true;
      }
      setMensaje({
        tipo: "error",
        texto: res.details?.length
          ? `${res.error}: ${res.details
              .map((d) => `${d.path || "campo"} ${d.message}`)
              .join(" | ")}`
          : res.error,
      });
      return false;
    },
    [cargar],
  );

  async function crearCategoria(e: FormEvent) {
    e.preventDefault();
    const parsed = createCategoriaSchema.safeParse({
      nombre: catForm.nombre,
      orden: Number(catForm.orden),
    });
    if (!parsed.success) {
      setMensaje({ tipo: "error", texto: issuesToText(parsed.error) });
      return;
    }
    const ok = await reportar(
      catalogoApi.createCategoria(parsed.data),
      "Categoría creada",
    );
    if (ok) setCatForm(VACIO_CAT);
  }

  async function guardarCategoria(id: string) {
    const parsed = createCategoriaSchema.safeParse({
      nombre: catEdit.nombre,
      orden: Number(catEdit.orden),
    });
    if (!parsed.success) {
      setMensaje({ tipo: "error", texto: issuesToText(parsed.error) });
      return;
    }
    const ok = await reportar(
      catalogoApi.updateCategoria(id, parsed.data),
      "Categoría actualizada",
    );
    if (ok) {
      setCatEditId(null);
      setCatEdit(VACIO_CAT);
    }
  }

  async function eliminarCategoria(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await reportar(catalogoApi.deleteCategoria(id), "Categoría eliminada");
  }

  async function crearProducto(e: FormEvent) {
    e.preventDefault();
    const parsed = createProductoSchema.safeParse({
      sku: prodForm.sku,
      nombre: prodForm.nombre,
      unidad: prodForm.unidad,
      descripcion: prodForm.descripcion,
      categoriaId: prodForm.categoriaId,
    });
    if (!parsed.success) {
      setMensaje({ tipo: "error", texto: issuesToText(parsed.error) });
      return;
    }
    const ok = await reportar(
      catalogoApi.createProducto(parsed.data),
      "Producto creado",
    );
    if (ok) setProdForm(VACIO_PROD);
  }

  async function guardarProducto(id: string) {
    const parsed = createProductoSchema.safeParse({
      sku: prodEdit.sku,
      nombre: prodEdit.nombre,
      unidad: prodEdit.unidad,
      descripcion: prodEdit.descripcion,
      categoriaId: prodEdit.categoriaId,
    });
    if (!parsed.success) {
      setMensaje({ tipo: "error", texto: issuesToText(parsed.error) });
      return;
    }
    const ok = await reportar(
      catalogoApi.updateProducto(id, parsed.data),
      "Producto actualizado",
    );
    if (ok) {
      setProdEditId(null);
      setProdEdit(VACIO_PROD);
    }
  }

  async function eliminarProducto(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await reportar(catalogoApi.deleteProducto(id), "Producto eliminado");
  }

  const productosVisibles = useMemo(() => {
    const q = normalizarTexto(busqueda);
    return productos.filter((p) => {
      if (filtroCategoria && p.categoriaId !== filtroCategoria) return false;
      if (q === "") return true;
      const haystack = normalizarTexto(
        `${p.sku} ${p.nombre} ${p.unidad} ${p.descripcion}`,
      );
      return haystack.includes(q);
    });
  }, [productos, busqueda, filtroCategoria]);

  const hayFiltro = busqueda.trim() !== "" || filtroCategoria !== "";

  return (
    <div className="mt-6 flex flex-col gap-10">
      {mensaje && (
        <div
          role="status"
          className={`rounded border px-3 py-2 text-sm ${
            mensaje.tipo === "ok"
              ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categorías ({categorias.length})</h2>
          <button
            type="button"
            onClick={() => void cargar()}
            className="text-sm text-blue-600 hover:underline"
          >
            Refrescar
          </button>
        </div>

        <form onSubmit={crearCategoria} className="mt-3 flex flex-wrap gap-2">
          <input
            className={inputCls}
            placeholder="Nombre de categoría"
            value={catForm.nombre}
            onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })}
          />
          <input
            className={`${inputCls} w-24`}
            type="number"
            min={0}
            placeholder="Orden"
            value={catForm.orden}
            onChange={(e) => setCatForm({ ...catForm, orden: e.target.value })}
          />
          <button
            type="submit"
            className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Agregar
          </button>
        </form>

        {cargando ? (
          <p className="mt-3 text-sm text-zinc-500">Cargando…</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {categorias.map((c) =>
              catEditId === c.id ? (
                <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
                  <input
                    className={inputCls}
                    value={catEdit.nombre}
                    onChange={(e) =>
                      setCatEdit({ ...catEdit, nombre: e.target.value })
                    }
                  />
                  <input
                    className={`${inputCls} w-24`}
                    type="number"
                    min={0}
                    value={catEdit.orden}
                    onChange={(e) =>
                      setCatEdit({ ...catEdit, orden: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => void guardarCategoria(c.id)}
                    className="text-sm text-green-600 hover:underline"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCatEditId(null);
                      setCatEdit(VACIO_CAT);
                    }}
                    className="text-sm text-zinc-500 hover:underline"
                  >
                    Cancelar
                  </button>
                </li>
              ) : (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">
                    <span className="font-medium">{c.nombre}</span>{" "}
                    <span className="text-zinc-500">#{c.orden}</span>
                  </span>
                  <span className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCatEditId(c.id);
                        setCatEdit({ nombre: c.nombre, orden: String(c.orden) });
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void eliminarCategoria(c.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </span>
                </li>
              ),
            )}
            {categorias.length === 0 && (
              <li className="py-2 text-sm text-zinc-500">Sin categorías.</li>
            )}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Productos ({productos.length})</h2>

        <form onSubmit={crearProducto} className="mt-3 flex flex-wrap gap-2">
          <input
            className={`${inputCls} w-32`}
            placeholder="SKU"
            value={prodForm.sku}
            onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Nombre"
            value={prodForm.nombre}
            onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })}
          />
          <input
            className={`${inputCls} w-32`}
            placeholder="Unidad (bolsa 50 kg)"
            value={prodForm.unidad}
            onChange={(e) => setProdForm({ ...prodForm, unidad: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Descripción"
            value={prodForm.descripcion}
            onChange={(e) =>
              setProdForm({ ...prodForm, descripcion: e.target.value })
            }
          />
          <select
            className={inputCls}
            value={prodForm.categoriaId}
            onChange={(e) =>
              setProdForm({ ...prodForm, categoriaId: e.target.value })
            }
          >
            <option value="">— Elegí categoría —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Agregar
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            className={`${inputCls} min-w-56`}
            placeholder="Buscar por nombre, SKU o unidad"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className={inputCls}
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <span className="text-sm text-zinc-500">
            Mostrando {productosVisibles.length} de {productos.length}
          </span>
          {hayFiltro && (
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setFiltroCategoria("");
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>

        {cargando ? (
          <p className="mt-3 text-sm text-zinc-500">Cargando…</p>
        ) : (
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Unidad</th>
                <th className="py-2 pr-3">Categoría</th>
                <th className="py-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosVisibles.map((p) =>
                prodEditId === p.id ? (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="py-2 pr-3">
                      <input
                        className={`${inputCls} w-28`}
                        value={prodEdit.sku}
                        onChange={(e) =>
                          setProdEdit({ ...prodEdit, sku: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className={inputCls}
                        value={prodEdit.nombre}
                        onChange={(e) =>
                          setProdEdit({ ...prodEdit, nombre: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className={`${inputCls} w-28`}
                        value={prodEdit.unidad}
                        onChange={(e) =>
                          setProdEdit({ ...prodEdit, unidad: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        className={inputCls}
                        value={prodEdit.categoriaId}
                        onChange={(e) =>
                          setProdEdit({
                            ...prodEdit,
                            categoriaId: e.target.value,
                          })
                        }
                      >
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => void guardarProducto(p.id)}
                        className="mr-3 text-green-600 hover:underline"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProdEditId(null);
                          setProdEdit(VACIO_PROD);
                        }}
                        className="text-zinc-500 hover:underline"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="py-2 pr-3 font-mono">{p.sku}</td>
                    <td className="py-2 pr-3">{p.nombre}</td>
                    <td className="py-2 pr-3">{p.unidad}</td>
                    <td className="py-2 pr-3">{p.categoria?.nombre ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => {
                          setProdEditId(p.id);
                          setProdEdit({
                            sku: p.sku,
                            nombre: p.nombre,
                            unidad: p.unidad,
                            descripcion: p.descripcion,
                            categoriaId: p.categoriaId,
                          });
                        }}
                        className="mr-3 text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void eliminarProducto(p.id)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ),
              )}
              {productosVisibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-2 text-zinc-500">
                    {hayFiltro
                      ? "Sin resultados para esa búsqueda."
                      : "Sin productos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
