import { request } from "./httpClient";
import type {
  Cotizacion,
  CotizacionResponse,
  CrearCotizacionInput,
} from "@/lib/validators/cotizacion";

export type { ApiResult, ApiErrorDetail } from "./httpClient";
export type {
  Cotizacion,
  CotizacionResponse,
  CrearCotizacionInput,
  Comparacion,
  ComercioComparado,
  MaterialCotizado,
} from "@/lib/validators/cotizacion";

const BASE = "/api/cotizaciones";

export const cotizacionApi = {
  crear: (data: CrearCotizacionInput) =>
    request<CotizacionResponse>(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listar: () => request<Cotizacion[]>(BASE),
  obtener: (id: string) => request<CotizacionResponse>(`${BASE}/${id}`),
};
