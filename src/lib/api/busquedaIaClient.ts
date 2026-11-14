import { request } from "./httpClient";
import type { BusquedaIaResponse } from "@/lib/validators/busqueda";

export type { ApiResult, ApiErrorDetail } from "./httpClient";
export type { BusquedaIaResponse } from "@/lib/validators/busqueda";

const BASE = "/api/v1/busqueda-ia";

export const busquedaIaApi = {
  interpretar: (consulta: string) =>
    request<BusquedaIaResponse>(BASE, {
      method: "POST",
      body: JSON.stringify({ consulta }),
    }),
};
