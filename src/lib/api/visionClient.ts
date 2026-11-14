import { request } from "./httpClient";
import type { VisionResponse } from "@/lib/validators/vision";

export type { ApiResult, ApiErrorDetail } from "./httpClient";
export type {
  IdentificacionVisual,
  OfertaCompatible,
  VisionResponse,
} from "@/lib/validators/vision";

const BASE = "/api/v1/vision";

export const visionApi = {
  identificar: (imagen: File) => {
    const form = new FormData();
    form.append("imagen", imagen);
    return request<VisionResponse>(BASE, { method: "POST", body: form });
  },
};
