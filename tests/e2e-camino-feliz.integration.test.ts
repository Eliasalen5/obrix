import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { ROLES, type Role } from "@/lib/auth/constants";

import * as asistenteRoute from "@/app/api/asistente/route";
import * as cotizacionesRoute from "@/app/api/cotizaciones/route";
import * as cotizacionByIdRoute from "@/app/api/cotizaciones/[id]/route";
import * as pedidosRoute from "@/app/api/pedidos/route";
import * as pedidoByIdRoute from "@/app/api/pedidos/[id]/route";
import * as comercioPedidosRoute from "@/app/api/comercio/pedidos/route";
import * as comercioPedidoByIdRoute from "@/app/api/comercio/pedidos/[id]/route";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/ai/config", () => ({
  resolveAiConfig: () => ({
    demo: true,
    model: "test",
    baseUrl: "http://test",
    timeoutMs: 5000,
  }),
  DEFAULT_BASE_URL: "http://test",
  DEFAULT_MODEL: "test",
  DEFAULT_TIMEOUT_MS: 5000,
}));

type SessionMock = ReturnType<typeof vi.fn>;
const sessionMock = getServerSession as unknown as SessionMock;

type Producto = {
  id: string;
  sku: string;
  nombre: string;
  unidad: string;
  descripcion: string;
  categoriaId: string;
};

type Comercio = {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  lat: number;
  lng: number;
  activo: boolean;
  ownerId: string;
};

type Oferta = {
  id: string;
  comercioId: string;
  productoId: string;
  precio: number;
  stock: number;
  activo: boolean;
};

type MaterialRow = {
  id: string;
  cotizacionId: string;
  productoId: string | null;
  nombre: string;
  cantidad: number;
  unidad: string;
};

type CotizacionRow = {
  id: string;
  clienteId: string;
  prompt: string;
  estado: string;
  resultadoJson: string | null;
  createdAt: Date;
  materiales: MaterialRow[];
};

type PedidoItemRow = {
  id: string;
  pedidoId: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
};

type PedidoRow = {
  id: string;
  clienteId: string;
  comercioId: string;
  cotizacionId: string | null;
  estado: string;
  total: number;
  createdAt: Date;
  items: PedidoItemRow[];
};

function createId() {
  return "id" + Math.random().toString(36).slice(2, 9);
}

class Store {
  productos: Producto[] = [];
  comercios: Comercio[] = [];
  ofertas: Oferta[] = [];
  cotizaciones: CotizacionRow[] = [];
  pedidos: PedidoRow[] = [];
  materialSeq = 0;
  pedidoItemSeq = 0;

  reset() {
    this.productos = [];
    this.comercios = [];
    this.ofertas = [];
    this.cotizaciones = [];
    this.pedidos = [];
    this.materialSeq = 0;
    this.pedidoItemSeq = 0;
  }
}

const store = new Store();

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    producto: {
      findMany: vi.fn(async ({ select }: any) => {
        return store.productos.map((p) => {
          if (!select) return p;
          const out: any = {};
          for (const k of Object.keys(select)) if (select[k]) out[k] = (p as any)[k];
          return out;
        });
      }),
    },
    comercio: {
      findFirst: vi.fn(async ({ where }: any) => {
        const w = where || {};
        for (const c of store.comercios) {
          let ok = true;
          if (w.id && c.id !== w.id) ok = false;
          if (w.activo !== undefined && c.activo !== w.activo) ok = false;
          if (w.ownerId && c.ownerId !== w.ownerId) ok = false;
          if (ok) return { ...c };
        }
        return null;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        const w = where || {};
        for (const c of store.comercios) {
          if (w.ownerId && c.ownerId === w.ownerId) return { id: c.id };
        }
        return null;
      }),
    },
    oferta: {
      findMany: vi.fn(async ({ where }: any) => {
        const w = where || {};
        const out: any[] = [];
        for (const o of store.ofertas) {
          let ok = true;
          if (w.activo !== undefined && o.activo !== w.activo) ok = false;
          if (w.comercioId && o.comercioId !== w.comercioId) ok = false;
          if (w.comercio?.activo !== undefined) {
            const c = store.comercios.find((cc) => cc.id === o.comercioId);
            if (!c || c.activo !== w.comercio.activo) ok = false;
          }
          if (w.productoId) {
            const inSet = asArray(w.productoId.in ?? w.productoId);
            if (!inSet.includes(o.productoId)) ok = false;
          }
          if (ok) {
            const c = store.comercios.find((cc) => cc.id === o.comercioId);
            out.push({
              productoId: o.productoId,
              precio: o.precio,
              stock: o.stock,
              comercio: c
                ? {
                    id: c.id,
                    nombre: c.nombre,
                    direccion: c.direccion,
                    telefono: c.telefono,
                    lat: c.lat,
                    lng: c.lng,
                  }
                : undefined,
            });
          }
        }
        return out;
      }),
    },
    cotizacion: {
      create: vi.fn(async ({ data, include }: any) => {
        const cotizacionId = createId();
        const materiales: MaterialRow[] = (data.materiales?.create || []).map(
          (m: any) => ({
            id: `m${++store.materialSeq}`,
            cotizacionId,
            productoId: m.productoId ?? null,
            nombre: m.nombre,
            cantidad: m.cantidad,
            unidad: m.unidad,
          }),
        );
        const row: CotizacionRow = {
          id: cotizacionId,
          clienteId: data.clienteId,
          prompt: data.prompt || "",
          estado: data.estado || "COMPARADA",
          resultadoJson: null,
          createdAt: new Date(),
          materiales,
        };
        store.cotizaciones.push(row);
        const res: any = { ...row, materiales: row.materiales.map((x) => ({ ...x })) };
        return res;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = store.cotizaciones.findIndex((c) => c.id === where.id);
        if (idx >= 0) {
          if (data.resultadoJson !== undefined)
            store.cotizaciones[idx].resultadoJson = data.resultadoJson;
        }
        return store.cotizaciones[idx];
      }),
      findFirst: vi.fn(async ({ where, include }: any) => {
        const w = where || {};
        for (const c of store.cotizaciones) {
          let ok = true;
          if (w.id && c.id !== w.id) ok = false;
          if (w.clienteId && c.clienteId !== w.clienteId) ok = false;
          if (ok) {
            if (include?.materiales) {
              return { ...c, materiales: c.materiales.map((m) => ({ ...m })) };
            }
            return { ...c };
          }
        }
        return null;
      }),
      findMany: vi.fn(async () => []),
    },
    pedido: {
      create: vi.fn(async ({ data, include }: any) => {
        const pedidoId = createId();
        const items: PedidoItemRow[] = (data.items?.create || []).map((it: any) => ({
          id: `pi${++store.pedidoItemSeq}`,
          pedidoId,
          productoId: it.productoId,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
        }));
        const row: PedidoRow = {
          id: pedidoId,
          clienteId: data.clienteId,
          comercioId: data.comercioId,
          cotizacionId: data.cotizacionId ?? null,
          estado: data.estado || "PENDIENTE",
          total: data.total,
          createdAt: new Date(),
          items,
        };
        store.pedidos.push(row);
        if (include?.comercio || include?.items?.include?.producto) {
          const c = store.comercios.find((cc) => cc.id === row.comercioId);
          return {
            ...row,
            comercio: c
              ? { id: c.id, nombre: c.nombre, direccion: c.direccion, telefono: c.telefono }
              : null,
            items: row.items.map((it) => {
              const p = store.productos.find((pp) => pp.id === it.productoId);
              return {
                ...it,
                producto: p
                  ? { id: p.id, sku: p.sku, nombre: p.nombre, unidad: p.unidad }
                  : null,
              };
            }),
          };
        }
        return row;
      }),
      findMany: vi.fn(async ({ where, include }: any) => {
        const w = where || {};
        return store.pedidos
          .filter((ped) => {
            let ok = true;
            if (w.clienteId && ped.clienteId !== w.clienteId) ok = false;
            if (w.comercioId && ped.comercioId !== w.comercioId) ok = false;
            return ok;
          })
          .map((ped) => {
            if (include?.comercio || include?.items?.include?.producto) {
              const c = store.comercios.find((cc) => cc.id === ped.comercioId);
              return {
                ...ped,
                comercio: c
                  ? { id: c.id, nombre: c.nombre, direccion: c.direccion, telefono: c.telefono }
                  : null,
                items: ped.items.map((it) => {
                  const p = store.productos.find((pp) => pp.id === it.productoId);
                  return {
                    ...it,
                    producto: p
                      ? { id: p.id, sku: p.sku, nombre: p.nombre, unidad: p.unidad }
                      : null,
                  };
                }),
              };
            }
            return { ...ped };
          });
      }),
      findFirst: vi.fn(async ({ where, include, select }: any) => {
        const w = where || {};
        for (const ped of store.pedidos) {
          let ok = true;
          if (w.id && ped.id !== w.id) ok = false;
          if (w.clienteId && ped.clienteId !== w.clienteId) ok = false;
          if (w.comercioId && ped.comercioId !== w.comercioId) ok = false;
          if (ok) {
            if (select) return { id: ped.id, estado: ped.estado };
            if (include?.comercio || include?.items?.include?.producto) {
              const c = store.comercios.find((cc) => cc.id === ped.comercioId);
              return {
                ...ped,
                comercio: c
                  ? { id: c.id, nombre: c.nombre, direccion: c.direccion, telefono: c.telefono }
                  : null,
                items: ped.items.map((it) => {
                  const p = store.productos.find((pp) => pp.id === it.productoId);
                  return {
                    ...it,
                    producto: p
                      ? { id: p.id, sku: p.sku, nombre: p.nombre, unidad: p.unidad }
                      : null,
                  };
                }),
              };
            }
            return { ...ped };
          }
        }
        return null;
      }),
      update: vi.fn(async ({ where, data, include }: any) => {
        const idx = store.pedidos.findIndex((p) => p.id === where.id);
        if (idx < 0) return null;
        if (data.estado !== undefined) store.pedidos[idx].estado = data.estado;
        const ped = store.pedidos[idx];
        if (include?.comercio || include?.items?.include?.producto) {
          const c = store.comercios.find((cc) => cc.id === ped.comercioId);
          return {
            ...ped,
            comercio: c
              ? { id: c.id, nombre: c.nombre, direccion: c.direccion, telefono: c.telefono }
              : null,
            items: ped.items.map((it) => {
              const p = store.productos.find((pp) => pp.id === it.productoId);
              return {
                ...it,
                producto: p
                  ? { id: p.id, sku: p.sku, nombre: p.nombre, unidad: p.unidad }
                  : null,
              };
            }),
          };
        }
        return ped;
      }),
    },
  },
}));

function jsonReq(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  store.reset();

  store.productos = [
    {
      id: "p1",
      sku: "OBR-001",
      nombre: "Ladrillo común",
      unidad: "unidad",
      descripcion: "",
      categoriaId: "cat1",
    },
    {
      id: "p2",
      sku: "OBR-002",
      nombre: "Cemento de albañilería",
      unidad: "bolsa 50 kg",
      descripcion: "",
      categoriaId: "cat1",
    },
    {
      id: "p3",
      sku: "OBR-003",
      nombre: "Arena gruesa",
      unidad: "m³",
      descripcion: "",
      categoriaId: "cat1",
    },
    {
      id: "p4",
      sku: "OBR-004",
      nombre: "Hierro del 8 mm",
      unidad: "unidad",
      descripcion: "",
      categoriaId: "cat1",
    },
    {
      id: "p5",
      sku: "OBR-005",
      nombre: "Chapa de hierro",
      unidad: "unidad",
      descripcion: "",
      categoriaId: "cat1",
    },
  ];

  store.comercios = [
    {
      id: "com1",
      nombre: "Corralón Sur",
      direccion: "Av. Calchaquí 1500",
      telefono: "011-4567",
      lat: -34.7245,
      lng: -58.2551,
      activo: true,
      ownerId: "u2",
    },
  ];

  store.ofertas = [
    { id: "o1", comercioId: "com1", productoId: "p1", precio: 11500, stock: 1000, activo: true },
    { id: "o2", comercioId: "com1", productoId: "p2", precio: 1450, stock: 500, activo: true },
    { id: "o3", comercioId: "com1", productoId: "p3", precio: 25000, stock: 50, activo: true },
    { id: "o4", comercioId: "com1", productoId: "p4", precio: 180, stock: 5000, activo: true },
    { id: "o5", comercioId: "com1", productoId: "p5", precio: 35000, stock: 10, activo: true },
  ];

  sessionMock.mockReset();
});

function sessionCliente() {
  sessionMock.mockResolvedValue({ user: { id: "u1", role: ROLES.CLIENTE as Role }, expires: "" });
}
function sessionComercio() {
  sessionMock.mockResolvedValue({ user: { id: "u2", role: ROLES.COMERCIO as Role }, expires: "" });
}
function sessionAdmin() {
  sessionMock.mockResolvedValue({ user: { id: "u3", role: ROLES.ADMIN as Role }, expires: "" });
}

describe("E2E camino feliz (API)", () => {
  it("asistente → cotización → pedido → cancelar; comercio ve y avanza", async () => {
    sessionCliente();
    let res = await asistenteRoute.POST(
      jsonReq("http://x/api/asistente", "POST", {
        descripcion: "Quiero hacer una parrilla de obra",
      }),
    );
    expect(res.status).toBe(200);
    const asist = await res.json();
    expect(asist.data.materiales.length).toBeGreaterThan(0);

    const materialesCot = asist.data.materiales.map((m: any) => ({
      nombre: m.nombre,
      cantidad: m.cantidad,
      unidad: m.unidad,
    }));

    res = await cotizacionesRoute.POST(
      jsonReq("http://x/api/cotizaciones", "POST", {
        prompt: "parrilla",
        materiales: materialesCot,
      }),
    );
    expect(res.status).toBe(201);
    const cot = await res.json();
    expect(cot.data.comparacion.comercios.length).toBeGreaterThan(0);
    const com = cot.data.comparacion.comercios[0];
    expect(com.cubreTodo).toBe(true);

    res = await pedidosRoute.POST(
      jsonReq("http://x/api/pedidos", "POST", {
        cotizacionId: cot.data.cotizacion.id,
        comercioId: com.comercioId,
      }),
    );
    expect(res.status).toBe(201);
    const pedCreado = await res.json();
    expect(pedCreado.data.estado).toBe("PENDIENTE");
    expect(pedCreado.data.items.length).toBe(materialesCot.length);

    res = await pedidosRoute.GET();
    expect(res.status).toBe(200);
    const lista = await res.json();
    expect(lista.data.length).toBe(1);

    res = await pedidoByIdRoute.PATCH(
      jsonReq("http://x/api/pedidos/pid", "PATCH", { estado: "CANCELADO" }),
      ctx(pedCreado.data.id),
    );
    expect(res.status).toBe(200);
    const cancelado = await res.json();
    expect(cancelado.data.estado).toBe("CANCELADO");

    sessionComercio();
    res = await comercioPedidosRoute.GET();
    expect(res.status).toBe(200);
    const listaCom = await res.json();
    expect(listaCom.data.length).toBe(1);

    sessionCliente();
    res = await pedidosRoute.POST(
      jsonReq("http://x/api/pedidos", "POST", {
        cotizacionId: cot.data.cotizacion.id,
        comercioId: com.comercioId,
      }),
    );
    expect(res.status).toBe(201);
    const ped2 = await res.json();
    expect(ped2.data.estado).toBe("PENDIENTE");

    sessionComercio();
    res = await comercioPedidoByIdRoute.PATCH(
      jsonReq("http://x/api/comercio/pedidos/pid", "PATCH", {
        estado: "CONFIRMADO",
      }),
      ctx(ped2.data.id),
    );
    expect(res.status).toBe(200);
    const conf = await res.json();
    expect(conf.data.estado).toBe("CONFIRMADO");
  });
});
