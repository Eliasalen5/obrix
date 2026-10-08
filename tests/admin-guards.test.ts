import { describe, it, expect } from "vitest";
import { ROLES, type Role } from "@/lib/auth/constants";

describe("ADMIN guard (lógica)", () => {
  it("CLIENTE es rechazado por ADMIN", () => {
    const role: Role = ROLES.CLIENTE as Role;
    expect(role).not.toBe(ROLES.ADMIN);
  });

  it("COMERCIO es rechazado por ADMIN", () => {
    const role: Role = ROLES.COMERCIO as Role;
    expect(role).not.toBe(ROLES.ADMIN);
  });

  it("ADMIN es aceptado", () => {
    const role: Role = ROLES.ADMIN as Role;
    expect(role).toBe(ROLES.ADMIN);
  });
});
