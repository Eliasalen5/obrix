import { describe, it, expect } from "vitest";
import { decideAccess, CATALOGO_ALLOWED_ROLES } from "@/lib/auth/access";
import { ROLES, type Role } from "@/lib/auth/constants";

describe("acceso catálogo maestro (seguridad)", () => {
  it("solo ADMIN está en los roles permitidos", () => {
    expect(CATALOGO_ALLOWED_ROLES).toEqual([ROLES.ADMIN]);
  });

  it("sin sesión (undefined) devuelve 401", () => {
    const r = decideAccess(undefined, CATALOGO_ALLOWED_ROLES);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it("CLIENTE es rechazado con 403", () => {
    const r = decideAccess(ROLES.CLIENTE as Role, CATALOGO_ALLOWED_ROLES);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("COMERCIO es rechazado con 403", () => {
    const r = decideAccess(ROLES.COMERCIO as Role, CATALOGO_ALLOWED_ROLES);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("ADMIN es aceptado", () => {
    const r = decideAccess(ROLES.ADMIN as Role, CATALOGO_ALLOWED_ROLES);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.role).toBe(ROLES.ADMIN);
  });
});
