import { describe, it, expect } from "vitest";

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

describe("distancias (haversine)", () => {
  it("misma ubicación da 0", () => {
    expect(haversine(-34.6037, -58.3816, -34.6037, -58.3816)).toBe(0);
  });

  it("distancia razonable entre CABA y Quilmes (~17km)", () => {
    const d = haversine(-34.6037, -58.3816, -34.7245, -58.2551);
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(20);
  });
});
