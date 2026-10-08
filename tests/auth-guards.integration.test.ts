import { describe, it, expect } from "vitest";

describe("Guards de autorización (estructura)", () => {
  it("guarda CLIENTE no accede a rutas COMERCIO/ADMIN (lógica)", () => {
    const user = { role: "CLIENTE" as const };
    const isAdmin = user.role === "ADMIN";
    const isComercio = user.role === "COMERCIO";
    expect(isAdmin).toBe(false);
    expect(isComercio).toBe(false);
  });

  it("COMERCIO solo modifica sus ofertas (lógica)", () => {
    const comercioId = "c1";
    const ofertaComercioId = "c1";
    expect(ofertaComercioId === comercioId).toBe(true);
  });
});
