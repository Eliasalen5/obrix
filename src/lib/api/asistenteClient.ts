import { request } from "./httpClient";
import type { AsistenteResponse } from "@/lib/validators/asistente";

export type { ApiResult, ApiErrorDetail } from "./httpClient";
export type { AsistenteResponse } from "@/lib/validators/asistente";

const BASE = "/api/v1/asistente";

export const asistenteApi = {
  estimar: (descripcion: string) =>
    request<AsistenteResponse>(BASE, {
      method: "POST",
      body: JSON.stringify({ descripcion }),
    }),
};
