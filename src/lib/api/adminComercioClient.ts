import { request } from "./httpClient";
import type { AsignarPlanPayload } from "@/lib/validators/plan";

export type { ApiResult, ApiErrorDetail } from "./httpClient";

export type ComercioAdmin = {
  id: string;
  nombre: string;
  activo: boolean;
  plan: string;
  planVence: string | null;
  createdAt: string;
  owner: { id: string; nombre: string; email: string };
  _count: { ofertas: number; pedidos: number };
};

export type SuscripcionComercio = {
  id: string;
  comercioId: string;
  plan: string;
  precioMensual: number;
  comisionPct: number;
  estado: string;
  inicio: string;
  fin: string | null;
  motivo: string;
  createdAt: string;
};

export type AsignarPlanResult = {
  comercio: {
    id: string;
    nombre: string;
    plan: string;
    planVence: string | null;
  };
  suscripcion: SuscripcionComercio;
};

const BASE = "/api/v1/admin/comercios";

export const adminComercioApi = {
  listar: () => request<ComercioAdmin[]>(BASE),
  listarSuscripciones: (id: string) =>
    request<SuscripcionComercio[]>(`${BASE}/${id}/suscripciones`),
  asignarPlan: (id: string, data: AsignarPlanPayload) =>
    request<AsignarPlanResult>(`${BASE}/${id}/plan`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
