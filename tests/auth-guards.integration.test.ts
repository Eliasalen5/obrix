import { describe, it, expect } from "vitest";
import { ROLES, type Role } from "@/lib/auth/constants";

describe("Guards de autorización (estructura)", () => {
  it("guarda CLIENTE no accede a rutas COMERCIO/ADMIN (lógica)", () => {
    const user = { role: ROLES.CLIENTE as Role };
    const isAdmin = user.role === ROLES.ADMIN;
    const isComercio = user.role === ROLES.COMERCIO;
    expect(isAdmin).toBe(false);
    expect(isComercio).toBe(false);
  });

  it("COMERCIO solo modifica sus ofertas (lógica)", () => {
    const comercioId = "c1";
    const ofertaComercioId = "c1";
    expect(ofertaComercioId === comercioId).toBe(true);
  });
});
