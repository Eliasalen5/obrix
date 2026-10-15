import { describe, it, expect } from "vitest";
import {
  asistenteRequestSchema,
  asistenteResponseSchema,
  DESCRIPCION_MIN,
} from "@/lib/validators/asistente";

describe("asistenteRequestSchema", () => {
  it("acepta descripción válida", () => {
    const r = asistenteRequestSchema.safeParse({
      descripcion: "Quisiera hacer una parrilla de 1,5 metros de ancho",
    });
    expect(r.success).toBe(true);
  });

  it("recorta espacios", () => {
    const r = asistenteRequestSchema.safeParse({
      descripcion: "   Parrilla de 1.5 m   ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.descripcion.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("rechaza muy corta", () => {
    const r = asistenteRequestSchema.safeParse({
      descripcion: "x".repeat(DESCRIPCION_MIN - 1),
    });
    expect(r.success).toBe(false);
  });

  it("rechaza muy larga", () => {
    const r = asistenteRequestSchema.safeParse({
      descripcion: "x".repeat(2005),
    });
    expect(r.success).toBe(false);
  });
});

describe("asistenteResponseSchema", () => {
  const base = {
    titulo: "Parrilla (simulado): Parrilla de 1,5 m",
    materiales: [
      { nombre: "Ladrillo común", cantidad: 120, unidad: "unidad" },
    ],
    supuestos: ["Parrilla de 1,5 m"],
    aclaraciones: ["Estimación orientativa"],
    esEstimacion: true as const,
    modo: "demo" as const,
    aviso: "Respuesta simulada",
  };

  it("acepta respuesta válida", () => {
    const r = asistenteResponseSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("rechaza si no es estimación", () => {
    const r = asistenteResponseSchema.safeParse({ ...base, esEstimacion: false });
    expect(r.success).toBe(false);
  });

  it("rechaza modo inválido", () => {
    const r = asistenteResponseSchema.safeParse({ ...base, modo: "otro" as any });
    expect(r.success).toBe(false);
  });

  it("rechaza materiales sin nombre", () => {
    const r = asistenteResponseSchema.safeParse({
      ...base,
      materiales: [{ nombre: "   ", cantidad: 1, unidad: "u" }],
    });
    expect(r.success).toBe(false);
  });
});
