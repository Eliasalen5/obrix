import { request } from "./httpClient";
import type {
  ConsultaVisionRequest,
  ConsultaVisionResponse,
  VisionResponse,
} from "@/lib/validators/vision";

export type { ApiResult, ApiErrorDetail } from "./httpClient";
export type {
  ConsultaVisionRequest,
  ConsultaVisionResponse,
  IdentificacionVisual,
  OfertaCompatible,
  VisionResponse,
} from "@/lib/validators/vision";

const BASE = "/api/v1/vision";

export const visionApi = {
  identificar: (imagen: File, detalle: string) => {
    const form = new FormData();
    form.append("imagen", imagen);
    form.append("detalle", detalle);
    return request<VisionResponse>(BASE, { method: "POST", body: form });
  },
  consultar: (input: ConsultaVisionRequest) =>
    request<ConsultaVisionResponse>(`${BASE}/consulta`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
