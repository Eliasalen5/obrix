import { request } from "./httpClient";
import type {
  CreateCategoriaInput,
  UpdateCategoriaInput,
  CreateProductoInput,
  UpdateProductoInput,
} from "@/lib/validators/catalogo";

export type { ApiResult, ApiErrorDetail } from "./httpClient";

export type Categoria = {
  id: string;
  nombre: string;
  orden: number;
};

export type Producto = {
  id: string;
  sku: string;
  nombre: string;
  unidad: string;
  descripcion: string;
  categoriaId: string;
  categoria?: Categoria;
  codigoBarras?: string | null;
  fabricante?: string;
  codigoFabricante?: string | null;
  marca?: string;
};

const BASE = "/api/admin/catalogo";

export const catalogoApi = {
  listCategorias: () => request<Categoria[]>(`${BASE}/categorias`),
  createCategoria: (data: CreateCategoriaInput) =>
    request<Categoria>(`${BASE}/categorias`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategoria: (id: string, data: UpdateCategoriaInput) =>
    request<Categoria>(`${BASE}/categorias/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCategoria: (id: string) =>
    request<undefined>(`${BASE}/categorias/${id}`, { method: "DELETE" }),

  listProductos: () => request<Producto[]>(`${BASE}/productos`),
  createProducto: (data: CreateProductoInput) =>
    request<Producto>(`${BASE}/productos`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProducto: (id: string, data: UpdateProductoInput) =>
    request<Producto>(`${BASE}/productos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProducto: (id: string) =>
    request<undefined>(`${BASE}/productos/${id}`, { method: "DELETE" }),
};
