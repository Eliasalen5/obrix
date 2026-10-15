import { z } from "zod";

export const ESTADOS_PEDIDO = [
  "PENDIENTE",
  "CONFIRMADO",
  "PREPARADO",
  "ENTREGADO",
  "CANCELADO",
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const crearPedidoSchema = z.object({
  cotizacionId: z.string().trim().min(1, "Cotización requerida"),
  comercioId: z.string().trim().min(1, "Comercio requerido"),
});

export const actualizarEstadoPedidoSchema = z.object({
  estado: z.enum(ESTADOS_PEDIDO),
});

export const cancelarPedidoSchema = z.object({
  estado: z.literal("CANCELADO", {
    error: 'La única transición disponible es a "CANCELADO"',
  }),
});

export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;
export type ActualizarEstadoPedidoInput = z.infer<
  typeof actualizarEstadoPedidoSchema
>;
