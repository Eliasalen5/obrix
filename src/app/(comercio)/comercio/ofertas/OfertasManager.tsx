"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ZodError } from "zod";
import {
  ofertaApi,
  type ApiResult,
  type Oferta,
  type Producto,
} from "@/lib/api/ofertaClient";
import {
  createOfertaSchema,
  updateOfertaSchema,
} from "@/lib/validators/oferta";

type Mensaje = { tipo: "ok" | "error"; texto: string };

type AltaForm = { precio: string; stock: string; marca: string };
type EditForm = {
  precio: string;
  stock: string;
  marca: string;
  activo: boolean;
};

const ALTA_VACIA: AltaForm = { precio: "", stock: "0", marca: "" };
const EDIT_VACIO: EditForm = { precio: "", stock: "", marca: "", activo: true };

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

export default function OfertasManager() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const [altaId, setAltaId] = useState<string | null>(null);
  const [alta, setAlta] = useState<AltaForm>(ALTA_VACIA);

  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditForm>(EDIT_VACIO);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [cat, ofs] = await Promise.all([
      ofertaApi.listCatalogo(),
      ofertaApi.listOfertas(),
    ]);
    if (cat.ok) setProductos(cat.data);
    else setMensaje({ tipo: "error", texto: cat.error });
    if (ofs.ok) setOfertas(ofs.data);
    else setMensaje({ tipo: "error", texto: ofs.error });
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const ofertaPorProducto = useMemo(() => {
    const mapa = new Map<string, Oferta>();
    for (const o of ofertas) mapa.set(o.productoId, o);
    return mapa;
  }, [ofertas]);

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
          ? `${res.error}: ${res.details.map((d) => d.message).join(" | ")}`
          : res.error,
      });
      return false;
    },
    [cargar],
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

  return (
    <div className="mt-4 space-y-6">
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

      <section>
        <h2 className="text-lg font-medium">
          Ofertas activas ({ofertas.length})
        </h2>
        {cargando ? (
          <p className="mt-2 text-sm text-gray-500">Cargando…</p>
        ) : ofertas.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Todavía no activaste productos.
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
              {ofertas.map((o) =>
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
        <h2 className="text-lg font-medium">
          Catálogo maestro ({productos.length})
        </h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 pr-2">SKU</th>
              <th className="py-1 pr-2">Producto</th>
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
          </tbody>
        </table>
      </section>
    </div>
  );
}
