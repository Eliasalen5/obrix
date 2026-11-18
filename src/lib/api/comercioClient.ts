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

const BASE = "/api/v1/comercio/perfil";

export const comercioPerfilApi = {
  get: () => request<PerfilComercio>(BASE),
  update: (data: UpdatePerfilComercioInput) =>
    request<PerfilComercio>(BASE, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
