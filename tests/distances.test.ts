import { describe, it, expect } from "vitest";
import { haversineKm, redondearKm } from "@/lib/services/geo.service";

describe("distancias (haversine)", () => {
  it("misma ubicación da 0", () => {
    expect(haversineKm(-34.6037, -58.3816, -34.6037, -58.3816)).toBe(0);
  });

  it("distancia razonable entre CABA y Quilmes (~17km)", () => {
    const d = haversineKm(-34.6037, -58.3816, -34.7245, -58.2551);
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(20);
  });

  it("es simétrica", () => {
    const a = haversineKm(-34.6037, -58.3816, -34.7245, -58.2551);
    const b = haversineKm(-34.7245, -58.2551, -34.6037, -58.3816);
    expect(a).toBeCloseTo(b, 10);
  });

  it("redondea a un decimal", () => {
    expect(redondearKm(3.14159)).toBe(3.1);
  });
});
