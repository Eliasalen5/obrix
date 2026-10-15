import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/auth/constants";
import { type CrearPedidoInput, type EstadoPedido } from "@/lib/validators/pedido";
import { puedeTransicionar, redondear2 } from "./pedido-estado";

const detallePedido = {
  comercio: {
    select: { id: true, nombre: true, direccion: true, telefono: true },
  },
  items: {
    include: {
      producto: { select: { id: true, sku: true, nombre: true, unidad: true } },
    },
  },
} as const;

export type PedidoDetalle = {
  id: string;
  clienteId: string;
  comercioId: string;
  cotizacionId: string | null;
  estado: string;
  total: number;
  createdAt: Date;
  comercio: {
    id: string;
    nombre: string;
    direccion: string;
    telefono: string;
  };
  items: {
    id: string;
    pedidoId: string;
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    producto: {
      id: string;
      sku: string;
      nombre: string;
      unidad: string;
    };
  }[];
};

export type CrearPedidoResult =
  | { ok: true; pedido: PedidoDetalle }
  | { ok: false; motivo: "NO_COTIZACION" | "NO_COMERCIO" | "SIN_ITEMS" };

export type CambiarEstadoResult =
  | { ok: true; pedido: PedidoDetalle }
  | { ok: false; motivo: "NO_ENCONTRADO" | "TRANSICION" };

export const pedidoService = {
  async crear(
    clienteId: string,
    input: CrearPedidoInput,
  ): Promise<CrearPedidoResult> {
    const cotizacion = await prisma.cotizacion.findFirst({
      where: { id: input.cotizacionId, clienteId },
      include: { materiales: true },
    });
    if (!cotizacion) return { ok: false, motivo: "NO_COTIZACION" };

    const comercio = await prisma.comercio.findFirst({
      where: { id: input.comercioId, activo: true },
      select: { id: true },
    });
    if (!comercio) return { ok: false, motivo: "NO_COMERCIO" };

    const productoIds = [
      ...new Set(
        cotizacion.materiales
          .map((material) => material.productoId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const ofertas = productoIds.length
      ? await prisma.oferta.findMany({
          where: {
            comercioId: comercio.id,
            activo: true,
            productoId: { in: productoIds },
          },
          select: { productoId: true, precio: true },
        })
      : [];

    const precioPorProducto = new Map(
      ofertas.map((oferta) => [oferta.productoId, oferta.precio]),
    );

    const items = cotizacion.materiales
      .filter(
        (material) =>
          material.productoId !== null &&
          precioPorProducto.has(material.productoId),
      )
      .map((material) => ({
        productoId: material.productoId as string,
        cantidad: material.cantidad,
        precioUnitario: precioPorProducto.get(material.productoId as string) as number,
      }));

    if (items.length === 0) return { ok: false, motivo: "SIN_ITEMS" };

    const total = redondear2(
      items.reduce(
        (acumulado, item) => acumulado + item.cantidad * item.precioUnitario,
        0,
      ),
    );

    const pedido = await prisma.pedido.create({
      data: {
        clienteId,
        comercioId: comercio.id,
        cotizacionId: cotizacion.id,
        estado: "PENDIENTE",
        total,
        items: { create: items },
      },
      include: detallePedido,
    });

    return { ok: true, pedido: pedido as PedidoDetalle };
  },

  listarCliente(clienteId: string) {
    return prisma.pedido.findMany({
      where: { clienteId },
      include: detallePedido,
      orderBy: { createdAt: "desc" },
    });
  },

  obtenerCliente(clienteId: string, id: string) {
    return prisma.pedido.findFirst({
      where: { id, clienteId },
      include: detallePedido,
    });
  },

  listarComercio(comercioId: string) {
    return prisma.pedido.findMany({
      where: { comercioId },
      include: detallePedido,
      orderBy: { createdAt: "desc" },
    });
  },

  obtenerComercio(comercioId: string, id: string) {
    return prisma.pedido.findFirst({
      where: { id, comercioId },
      include: detallePedido,
    });
  },

  async cambiarEstadoComercio(
    comercioId: string,
    id: string,
    nuevo: EstadoPedido,
  ): Promise<CambiarEstadoResult> {
    const pedido = await prisma.pedido.findFirst({
      where: { id, comercioId },
      select: { id: true, estado: true },
    });
    if (!pedido) return { ok: false, motivo: "NO_ENCONTRADO" };

    if (!puedeTransicionar(ROLES.COMERCIO, pedido.estado as EstadoPedido, nuevo)) {
      return { ok: false, motivo: "TRANSICION" };
    }

    const actualizado = await prisma.pedido.update({
      where: { id },
      data: { estado: nuevo },
      include: detallePedido,
    });
    return { ok: true, pedido: actualizado as PedidoDetalle };
  },

  async cancelarCliente(
    clienteId: string,
    id: string,
  ): Promise<CambiarEstadoResult> {
    const pedido = await prisma.pedido.findFirst({
      where: { id, clienteId },
      select: { id: true, estado: true },
    });
    if (!pedido) return { ok: false, motivo: "NO_ENCONTRADO" };

    if (!puedeTransicionar(ROLES.CLIENTE, pedido.estado as EstadoPedido, "CANCELADO")) {
      return { ok: false, motivo: "TRANSICION" };
    }

    const actualizado = await prisma.pedido.update({
      where: { id },
      data: { estado: "CANCELADO" },
      include: detallePedido,
    });
    return { ok: true, pedido: actualizado as PedidoDetalle };
  },
};
