import { describe, it, expect } from "vitest";
import {
  crearCotizacionSchema,
  materialInputSchema,
  MATERIALES_MAX,
  PROMPT_MAX,
} from "@/lib/validators/cotizacion";

describe("materialInputSchema", () => {
  it("acepta un material válido", () => {
    const r = materialInputSchema.safeParse({
      nombre: "Ladrillo común",
      cantidad: 120,
      unidad: "unidad",
    });
    expect(r.success).toBe(true);
  });

  it("acepta productoId opcional", () => {
    const r = materialInputSchema.safeParse({
      nombre: "Ladrillo común",
      cantidad: 1,
      unidad: "unidad",
      productoId: "p1",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const r = materialInputSchema.safeParse({
      nombre: "  ",
      cantidad: 1,
      unidad: "unidad",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza cantidad <= 0", () => {
    const r = materialInputSchema.safeParse({
      nombre: "Ladrillo",
      cantidad: 0,
      unidad: "unidad",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza unidad vacía", () => {
    const r = materialInputSchema.safeParse({
      nombre: "Ladrillo",
      cantidad: 1,
      unidad: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("crearCotizacionSchema", () => {
  it("requiere al menos un material", () => {
    const r = crearCotizacionSchema.safeParse({ materiales: [] });
    expect(r.success).toBe(false);
  });

  it("acepta prompt opcional", () => {
    const r = crearCotizacionSchema.safeParse({
      materiales: [{ nombre: "Arena gruesa", cantidad: 1, unidad: "m³" }],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.prompt).toBeUndefined();
  });

  it("rechaza prompt demasiado largo", () => {
    const r = crearCotizacionSchema.safeParse({
      prompt: "x".repeat(PROMPT_MAX + 1),
      materiales: [{ nombre: "Arena gruesa", cantidad: 1, unidad: "m³" }],
    });
    expect(r.success).toBe(false);
  });

  it("rechaza más materiales que el máximo", () => {
    const materiales = Array.from({ length: MATERIALES_MAX + 1 }, () => ({
      nombre: "Arena",
      cantidad: 1,
      unidad: "m³",
    }));
    const r = crearCotizacionSchema.safeParse({ materiales });
    expect(r.success).toBe(false);
  });

  it("descarta claves desconocidas (no permite inyectar clienteId)", () => {
    const r = crearCotizacionSchema.safeParse({
      materiales: [{ nombre: "Arena gruesa", cantidad: 1, unidad: "m³" }],
      clienteId: "otro",
    });
    expect(r.success).toBe(true);
    if (r.success) expect("clienteId" in r.data).toBe(false);
  });

  it("acepta ubicación opcional válida", () => {
    const r = crearCotizacionSchema.safeParse({
      materiales: [{ nombre: "Arena gruesa", cantidad: 1, unidad: "m³" }],
      ubicacion: { lat: -34.6037, lng: -58.3816 },
    });
    expect(r.success).toBe(true);
  });

  it("rechaza latitud fuera de rango", () => {
    const r = crearCotizacionSchema.safeParse({
      materiales: [{ nombre: "Arena gruesa", cantidad: 1, unidad: "m³" }],
      ubicacion: { lat: 91, lng: 0 },
    });
    expect(r.success).toBe(false);
  });

  it("rechaza longitud fuera de rango", () => {
    const r = crearCotizacionSchema.safeParse({
      materiales: [{ nombre: "Arena gruesa", cantidad: 1, unidad: "m³" }],
      ubicacion: { lat: 0, lng: -181 },
    });
    expect(r.success).toBe(false);
  });
});
