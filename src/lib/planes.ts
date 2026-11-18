/**
 * Planes comerciales de Obrix. Fuente de verdad de precios, comisión y límites.
 * El plan se guarda en `Comercio.plan` como String (sin enums de Prisma) y se
 * valida con `asignarPlanSchema` antes de persistir.
 */
export const PLANES = {
  INICIAL: {
    id: "INICIAL",
    nombre: "Obrix Inicial",
    precioMensual: 0,
    comisionPct: 6,
    limiteProductos: 50,
  },
  COMERCIO: {
    id: "COMERCIO",
    nombre: "Obrix Comercio",
    precioMensual: 15000,
    comisionPct: 3.5,
    limiteProductos: null,
  },
  PROFESIONAL: {
    id: "PROFESIONAL",
    nombre: "Obrix Profesional",
    precioMensual: 40000,
    comisionPct: 2,
    limiteProductos: null,
  },
} as const;

export type PlanId = keyof typeof PLANES;
export type Plan = (typeof PLANES)[PlanId];

export const PLAN_IDS = ["INICIAL", "COMERCIO", "PROFESIONAL"] as const;
export const PLAN_DEFAULT: PlanId = "INICIAL";

export function esPlanId(valor: unknown): valor is PlanId {
  return typeof valor === "string" && valor in PLANES;
}

export function getPlan(id: string | null | undefined): Plan {
  return esPlanId(id) ? PLANES[id] : PLANES[PLAN_DEFAULT];
}

export function comisionPctDePlan(id: string | null | undefined): number {
  return getPlan(id).comisionPct;
}

export function limiteProductosDePlan(
  id: string | null | undefined,
): number | null {
  return getPlan(id).limiteProductos;
}
