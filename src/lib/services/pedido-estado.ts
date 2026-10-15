import { ROLES, type Role } from "@/lib/auth/constants";
import { type EstadoPedido } from "@/lib/validators/pedido";

type Transiciones = Partial<Record<EstadoPedido, EstadoPedido[]>>;

export const TRANSICIONES_PEDIDO: Record<Role, Transiciones> = {
  [ROLES.CLIENTE]: {
    PENDIENTE: ["CANCELADO"],
  },
  [ROLES.COMERCIO]: {
    PENDIENTE: ["CONFIRMADO", "CANCELADO"],
    CONFIRMADO: ["PREPARADO", "CANCELADO"],
    PREPARADO: ["ENTREGADO", "CANCELADO"],
  },
  [ROLES.ADMIN]: {},
};

export function puedeTransicionar(
  rol: Role,
  actual: EstadoPedido,
  nuevo: EstadoPedido,
): boolean {
  return TRANSICIONES_PEDIDO[rol]?.[actual]?.includes(nuevo) ?? false;
}

export function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}
