import { request } from "./httpClient";
import type { UpdatePerfilComercioInput } from "@/lib/validators/comercio";

export type { ApiResult, ApiErrorDetail } from "./httpClient";

export type PerfilComercio = {
  id: string;
  nombre: string;
  direccion: string;
  localidad: string;
  provincia: string;
  telefono: string;
  lat: number;
  lng: number;
  activo: boolean;
};

export type ResumenPedidoReciente = {
  id: string;
  estado: string;
  total: number;
  createdAt: string;
  itemsCount: number;
};

export type ResumenComercio = {
  plan: {
    id: string;
    nombre: string;
    comisionPct: number;
    limiteProductos: number | null;
  };
  productos: { publicados: number; activos: number };
  pedidos: { total: number; pendientes: number };
  ventas: { total: number; mes: number; ticketPromedio: number };
  recientes: ResumenPedidoReciente[];
};

const BASE = "/api/v1/comercio/perfil";

export const comercioPerfilApi = {
  get: () => request<PerfilComercio>(BASE),
  update: (data: UpdatePerfilComercioInput) =>
    request<PerfilComercio>(BASE, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const comercioResumenApi = {
  get: () => request<ResumenComercio>("/api/v1/comercio/resumen"),
};
