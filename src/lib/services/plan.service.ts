import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/planes";
import type { AsignarPlanInput } from "@/lib/validators/plan";

/** Error de dominio mapeable a HTTP por las rutas. */
export class PlanError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PlanError";
  }
}

const SUSCRIPCION_SELECT = {
  id: true,
  comercioId: true,
  plan: true,
  precioMensual: true,
  comisionPct: true,
  estado: true,
  inicio: true,
  fin: true,
  motivo: true,
  createdAt: true,
} as const;

export const planService = {
  listarComercios() {
    return prisma.comercio.findMany({
      select: {
        id: true,
        nombre: true,
        activo: true,
        plan: true,
        planVence: true,
        createdAt: true,
        owner: { select: { id: true, nombre: true, email: true } },
        _count: { select: { ofertas: true, pedidos: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  listarSuscripciones(comercioId: string) {
    return prisma.suscripcionComercio.findMany({
      where: { comercioId },
      select: SUSCRIPCION_SELECT,
      orderBy: { inicio: "desc" },
    });
  },

  /**
   * Asigna un plan a un comercio (facturación manual por ADMIN): cierra la
   * suscripción ACTIVA anterior y registra una nueva, actualizando el plan del
   * comercio en una sola transacción.
   */
  async asignarPlan(
    comercioId: string,
    input: AsignarPlanInput,
    asignadoPorId: string,
  ) {
    const plan = getPlan(input.plan);

    const comercio = await prisma.comercio.findUnique({
      where: { id: comercioId },
      select: { id: true },
    });
    if (!comercio) throw new PlanError(404, "Comercio no encontrado");

    return prisma.$transaction(async (tx) => {
      await tx.suscripcionComercio.updateMany({
        where: { comercioId, estado: "ACTIVA" },
        data: { estado: "CANCELADA", fin: new Date() },
      });

      const suscripcion = await tx.suscripcionComercio.create({
        data: {
          comercioId,
          plan: plan.id,
          precioMensual: plan.precioMensual,
          comisionPct: plan.comisionPct,
          estado: "ACTIVA",
          motivo: input.motivo ?? "",
          asignadoPorId,
        },
        select: SUSCRIPCION_SELECT,
      });

      const actualizado = await tx.comercio.update({
        where: { id: comercioId },
        data: { plan: plan.id, planVence: input.planVence ?? null },
        select: { id: true, nombre: true, plan: true, planVence: true },
      });

      return { comercio: actualizado, suscripcion };
    });
  },
};
