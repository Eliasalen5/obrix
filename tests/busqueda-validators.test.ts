import { describe, it, expect } from "vitest";
import {
  busquedaIaRequestSchema,
  busquedaInterpretadaSchema,
  busquedaIaResponseSchema,
  CONSULTA_MAX,
} from "@/lib/validators/busqueda";

describe("busquedaIaRequestSchema", () => {
  it("acepta una consulta válida y recorta espacios", () => {
    const parsed = busquedaIaRequestSchema.parse({
      consulta: "  pintura para terraza  ",
    });
    expect(parsed.consulta).toBe("pintura para terraza");
  });

  it("rechaza consultas demasiado cortas", () => {
    expect(busquedaIaRequestSchema.safeParse({ consulta: "ab" }).success).toBe(
      false,
    );
    expect(busquedaIaRequestSchema.safeParse({ consulta: "   " }).success).toBe(
      false,
    );
  });

  it("rechaza consultas demasiado largas", () => {
    expect(
      busquedaIaRequestSchema.safeParse({
        consulta: "a".repeat(CONSULTA_MAX + 1),
      }).success,
    ).toBe(false);
  });
});

describe("busquedaInterpretadaSchema", () => {
  it("acepta términos con y sin categoría", () => {
    expect(
      busquedaInterpretadaSchema.safeParse({
        terminos: "impermeabilizante membrana",
        categoria: "Pinturerías",
      }).success,
    ).toBe(true);
    expect(
      busquedaInterpretadaSchema.safeParse({ terminos: "tornillo" }).success,
    ).toBe(true);
  });

  it("rechaza salidas sin términos", () => {
    expect(busquedaInterpretadaSchema.safeParse({}).success).toBe(false);
    expect(
      busquedaInterpretadaSchema.safeParse({ terminos: "  " }).success,
    ).toBe(false);
  });
});

describe("busquedaIaResponseSchema", () => {
  it("exige modo demo o real", () => {
    expect(
      busquedaIaResponseSchema.safeParse({
        terminos: "cemento",
        modo: "demo",
      }).success,
    ).toBe(true);
    expect(
      busquedaIaResponseSchema.safeParse({
        terminos: "cemento",
        modo: "otro",
      }).success,
    ).toBe(false);
  });
});
