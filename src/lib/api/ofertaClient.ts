import { request } from "./httpClient";
import type {
  CreateOfertaInput,
  UpdateOfertaInput,
} from "@/lib/validators/oferta";
import type { Categoria, Producto } from "./catalogoClient";

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

export type CatalogoPage = {
  productos: Producto[];
  total: number;
  limit: number;
  offset: number;
};

const BASE = "/api/v1/comercio";

export const ofertaApi = {
  listCatalogo: (opts?: {
    q?: string;
    categoriaId?: string;
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
  }) => {
    const params = new URLSearchParams();
    if (opts?.q) params.set("q", opts.q);
    if (opts?.categoriaId) params.set("categoriaId", opts.categoriaId);
    if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
    if (opts?.offset !== undefined) params.set("offset", String(opts.offset));
    const qs = params.toString();
    return request<CatalogoPage>(`${BASE}/catalogo${qs ? `?${qs}` : ""}`, {
      signal: opts?.signal,
    });
  },
  listCategorias: () => request<Categoria[]>(`${BASE}/catalogo/categorias`),
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
