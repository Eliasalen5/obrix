import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/services/auth.service";
import { LOGIN_LIMIT_PER_MIN, loginRateLimiter } from "@/lib/rate-limit";
import { authOptions } from "@/lib/auth/options";
import { ROLES } from "@/lib/auth/constants";

vi.mock("@/lib/prisma", () => ({
  prisma: { usuario: { findUnique: vi.fn() } },
}));

vi.mock("@/lib/services/auth.service", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: () => ({}),
}));

const db = prisma as unknown as {
  usuario: { findUnique: Mock };
};
const verifyMock = verifyPassword as unknown as Mock;

type Authorize = (c: Record<string, unknown>) => Promise<unknown>;

function authorize() {
  const provider = authOptions.providers[0] as unknown as {
    options: { authorize: Authorize };
  };
  return provider.options.authorize;
}

const CREDS = { email: "user@test.com", password: "secreta123" };

describe("authOptions.authorize — rate limit y credenciales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginRateLimiter.reset();
    db.usuario.findUnique.mockResolvedValue(null);
    verifyMock.mockResolvedValue(false);
  });

  it("rechaza credenciales inválidas (email malformado) → null sin tocar la DB", async () => {
    const res = await authorize()({ email: "no-es-email", password: "x" });
    expect(res).toBeNull();
    expect(db.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("login correcto devuelve el usuario con su rol", async () => {
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      email: CREDS.email,
      nombre: "Ana",
      rol: ROLES.COMERCIO,
      passwordHash: "hash",
    });
    verifyMock.mockResolvedValue(true);

    const res = (await authorize()(CREDS)) as {
      id: string;
      role: string;
    };
    expect(res.id).toBe("u1");
    expect(res.role).toBe(ROLES.COMERCIO);
  });

  it("normaliza mayúsculas y espacios del email antes de buscar", async () => {
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      email: CREDS.email,
      nombre: "Ana",
      rol: ROLES.CLIENTE,
      passwordHash: "hash",
      tokenVersion: 0,
    });
    verifyMock.mockResolvedValue(true);

    const res = (await authorize()({
      email: "  User@Test.COM ",
      password: CREDS.password,
    })) as { id: string };

    expect(res.id).toBe("u1");
    expect(db.usuario.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: CREDS.email } }),
    );
  });

  it("fail-open si el rate limit no está disponible", async () => {
    const spy = vi.spyOn(loginRateLimiter, "check").mockResolvedValue({
      allowed: true,
      limit: LOGIN_LIMIT_PER_MIN,
      remaining: 0,
      retryAfterMs: 0,
      degraded: true,
    });
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      email: CREDS.email,
      nombre: "Ana",
      rol: ROLES.CLIENTE,
      passwordHash: "hash",
      tokenVersion: 0,
    });
    verifyMock.mockResolvedValue(true);

    const res = await authorize()(CREDS);
    expect(res).not.toBeNull();
    spy.mockRestore();
  });

  it("bloquea tras superar el límite de intentos (fuerza bruta) → null", async () => {
    for (let i = 0; i < LOGIN_LIMIT_PER_MIN; i++) {
      await authorize()(CREDS);
    }
    db.usuario.findUnique.mockClear();

    const res = await authorize()(CREDS);
    expect(res).toBeNull();
    // El bloqueo ocurre ANTES de consultar la DB.
    expect(db.usuario.findUnique).not.toHaveBeenCalled();
  });
});
