import { request } from "./httpClient";
import type {
  CreateOfertaInput,
  UpdateOfertaInput,
} from "@/lib/validators/oferta";
import type { Producto } from "./catalogoClient";

export type { ApiResult, ApiErrorDetail } from "./httpClient";
export type { Producto, Categoria } from "./catalogoClient";

export type Oferta = {
  id: string;
  comercioId: string;
  productoId: string;
  precio: number;
  stock: number;
  marca: string;
  presentacion: string;
  activo: boolean;
  producto?: Producto;
};

const BASE = "/api/comercio";

export const ofertaApi = {
  listCatalogo: () => request<Producto[]>(`${BASE}/catalogo`),
  listOfertas: () => request<Oferta[]>(`${BASE}/ofertas`),
  upsertOferta: (data: CreateOfertaInput) =>
    request<Oferta>(`${BASE}/ofertas`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateOferta: (id: string, data: UpdateOfertaInput) =>
    request<Oferta>(`${BASE}/ofertas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteOferta: (id: string) =>
    request<undefined>(`${BASE}/ofertas/${id}`, { method: "DELETE" }),
};
