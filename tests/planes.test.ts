import { describe, it, expect } from "vitest";
import {
  PLANES,
  PLAN_DEFAULT,
  PLAN_IDS,
  comisionPctDePlan,
  esPlanId,
  getPlan,
  limiteProductosDePlan,
} from "@/lib/planes";

describe("planes — catálogo", () => {
  it("define los tres planes comerciales", () => {
    expect(PLAN_IDS).toEqual(["INICIAL", "COMERCIO", "PROFESIONAL"]);
    expect(PLANES.INICIAL.precioMensual).toBe(0);
    expect(PLANES.INICIAL.comisionPct).toBe(6);
    expect(PLANES.INICIAL.limiteProductos).toBe(50);
    expect(PLANES.COMERCIO.comisionPct).toBe(3.5);
    expect(PLANES.COMERCIO.limiteProductos).toBeNull();
    expect(PLANES.PROFESIONAL.comisionPct).toBe(2);
    expect(PLANES.PROFESIONAL.limiteProductos).toBeNull();
  });
});

describe("planes — helpers", () => {
  it("esPlanId reconoce solo ids válidos", () => {
    expect(esPlanId("INICIAL")).toBe(true);
    expect(esPlanId("PROFESIONAL")).toBe(true);
    expect(esPlanId("GRATIS")).toBe(false);
    expect(esPlanId(null)).toBe(false);
    expect(esPlanId(42)).toBe(false);
  });

  it("getPlan cae al plan por defecto ante valores inválidos", () => {
    expect(getPlan("COMERCIO").id).toBe("COMERCIO");
    expect(getPlan("NO_EXISTE").id).toBe(PLAN_DEFAULT);
    expect(getPlan(undefined).id).toBe("INICIAL");
    expect(getPlan(null).id).toBe("INICIAL");
  });

  it("expone comisión y límite por plan", () => {
    expect(comisionPctDePlan("COMERCIO")).toBe(3.5);
    expect(comisionPctDePlan("invalido")).toBe(6);
    expect(limiteProductosDePlan("INICIAL")).toBe(50);
    expect(limiteProductosDePlan("PROFESIONAL")).toBeNull();
  });
});
