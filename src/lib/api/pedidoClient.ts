import { request } from "./httpClient";
import type { EstadoPedido } from "@/lib/validators/pedido";

export type { ApiResult, ApiErrorDetail } from "./httpClient";
export type { EstadoPedido } from "@/lib/validators/pedido";

export type PedidoItem = {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  producto: {
    id: string;
    sku: string;
    nombre: string;
    unidad: string;
  };
};

export type Pedido = {
  id: string;
  clienteId: string;
  comercioId: string;
  cotizacionId: string | null;
  estado: EstadoPedido;
  total: number;
  createdAt: string;
  comercio: {
    id: string;
    nombre: string;
    direccion: string;
    telefono: string;
  };
  items: PedidoItem[];
};

export type CrearPedidoInput = {
  cotizacionId: string;
  comercioId: string;
};

const BASE = "/api/v1/pedidos";
const BASE_COMERCIO = "/api/v1/comercio/pedidos";

export const pedidoApi = {
  listar: () => request<Pedido[]>(BASE),
  crear: (data: CrearPedidoInput) =>
    request<Pedido>(BASE, { method: "POST", body: JSON.stringify(data) }),
  obtener: (id: string) => request<Pedido>(`${BASE}/${id}`),
  cancelar: (id: string) =>
    request<Pedido>(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado: "CANCELADO" }),
    }),
};

export const comercioPedidoApi = {
  listar: () => request<Pedido[]>(BASE_COMERCIO),
  obtener: (id: string) => request<Pedido>(`${BASE_COMERCIO}/${id}`),
  cambiarEstado: (id: string, estado: EstadoPedido) =>
    request<Pedido>(`${BASE_COMERCIO}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
};
