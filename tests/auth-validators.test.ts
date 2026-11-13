import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  registroClienteSchema,
  solicitudAltaComercioSchema,
} from "@/lib/validators/auth";

const credenciales = {
  password: "secreta123",
  confirmPassword: "secreta123",
};

describe("schemas de auth — normalización de email", () => {
  it("loginSchema recorta y pasa el email a minúsculas", () => {
    const parsed = loginSchema.parse({
      email: "  Juan@Mail.COM ",
      password: "secreta123",
    });
    expect(parsed.email).toBe("juan@mail.com");
  });

  it("registerSchema normaliza el email", () => {
    const parsed = registerSchema.parse({
      ...credenciales,
      email: " Juan@Mail.COM ",
      nombre: "Juan",
    });
    expect(parsed.email).toBe("juan@mail.com");
  });

  it("registroClienteSchema normaliza el email", () => {
    const parsed = registroClienteSchema.parse({
      ...credenciales,
      email: " Juan@Mail.COM ",
      nombre: "Juan",
    });
    expect(parsed.email).toBe("juan@mail.com");
  });

  it("solicitudAltaComercioSchema normaliza el email", () => {
    const parsed = solicitudAltaComercioSchema.parse({
      ...credenciales,
      email: " Juan@Mail.COM ",
      nombreTitular: "Juan Pérez",
      telefonoTitular: "1123456789",
      nombreFantasia: "Ferretería Juan",
      direccion: "Av. Siempre Viva 123",
      lat: -34.6,
      lng: -58.4,
      telefonoComercial: "1123456789",
    });
    expect(parsed.email).toBe("juan@mail.com");
  });

  it("loginSchema sigue rechazando emails inválidos", () => {
    const parsed = loginSchema.safeParse({
      email: "no-es-email",
      password: "secreta123",
    });
    expect(parsed.success).toBe(false);
  });

  it("solicitudAltaComercioSchema rechaza coordenadas vacías", () => {
    const parsed = solicitudAltaComercioSchema.safeParse({
      ...credenciales,
      email: "juan@mail.com",
      nombreTitular: "Juan Pérez",
      telefonoTitular: "1123456789",
      nombreFantasia: "Ferretería Juan",
      direccion: "Av. Siempre Viva 123",
      lat: "",
      lng: "",
      telefonoComercial: "1123456789",
    });
    expect(parsed.success).toBe(false);
  });

  it("solicitudAltaComercioSchema acepta coordenadas numéricas como texto", () => {
    const parsed = solicitudAltaComercioSchema.parse({
      ...credenciales,
      email: "juan@mail.com",
      nombreTitular: "Juan Pérez",
      telefonoTitular: "1123456789",
      nombreFantasia: "Ferretería Juan",
      direccion: "Av. Siempre Viva 123",
      lat: "-34.6037",
      lng: "-58.3816",
      telefonoComercial: "1123456789",
    });
    expect(parsed.lat).toBe(-34.6037);
    expect(parsed.lng).toBe(-58.3816);
  });
});
