import { describe, it, expect } from "vitest";
import { ROLES } from "@/lib/auth/constants";

describe("Autorización por rol (unitarios puros)", () => {
  it("ADMIN, COMERCIO, CLIENTE existen", () => {
    expect(ROLES.ADMIN).toBe("ADMIN");
    expect(ROLES.COMERCIO).toBe("COMERCIO");
    expect(ROLES.CLIENTE).toBe("CLIENTE");
  });

  it("lógica de roles es correcta", () => {
    const roles = [ROLES.ADMIN, ROLES.COMERCIO, ROLES.CLIENTE];
    expect(new Set(roles).size).toBe(3);
    expect(roles.includes("ADMIN" as any)).toBe(true);
  });
});
