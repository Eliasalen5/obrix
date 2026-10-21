import { request } from "./httpClient";
import type {
  AprobarSolicitudInput,
  PropuestaProductoInput,
} from "@/lib/validators/solicitud";
import type { Producto } from "./catalogoClient";

export type { ApiResult, ApiErrorDetail } from "./httpClient";
export type { Producto, Categoria } from "./catalogoClient";

export type EstadoSolicitud =
  | "PENDIENTE_REVISION"
  | "APROBADA"
  | "VINCULADA"
  | "RECHAZADA";

export type SolicitudProducto = {
  id: string;
  comercioId: string;
  estado: EstadoSolicitud;
  datos: PropuestaProductoInput;
  productoId: string | null;
  motivoRechazo: string;
  createdAt: string;
  updatedAt: string;
  comercio?: { id: string; nombre: string; direccion?: string };
  producto?: { id: string; sku: string; nombre: string; unidad: string } | null;
};

export type SolicitudCreada = {
  solicitud: SolicitudProducto;
  posiblesDuplicados: Producto[];
};

const COMERCIO_BASE = "/api/comercio/solicitudes";
const ADMIN_BASE = "/api/admin/solicitudes";

export const solicitudComercioApi = {
  listSolicitudes: (estado?: EstadoSolicitud) => {
    const qs = estado ? `?estado=${estado}` : "";
    return request<SolicitudProducto[]>(`${COMERCIO_BASE}${qs}`);
  },
  crearSolicitud: (propuesta: PropuestaProductoInput) =>
    request<SolicitudCreada>(COMERCIO_BASE, {
      method: "POST",
      body: JSON.stringify({ propuesta }),
    }),
};

export const solicitudAdminApi = {
  listSolicitudes: (estado?: EstadoSolicitud) => {
    const qs = estado ? `?estado=${estado}` : "";
    return request<SolicitudProducto[]>(`${ADMIN_BASE}${qs}`);
  },
  aprobar: (id: string, input: AprobarSolicitudInput) =>
    request<SolicitudProducto>(`${ADMIN_BASE}/${id}/aprobar`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  rechazar: (id: string, motivo: string) =>
    request<SolicitudProducto>(`${ADMIN_BASE}/${id}/rechazar`, {
      method: "POST",
      body: JSON.stringify({ motivo }),
    }),
};
