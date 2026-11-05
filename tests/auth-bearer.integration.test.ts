import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { resolveIdentity } from "@/lib/auth/token";
import { requireClienteApi } from "@/lib/auth/apiAuth";
import { ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { usuario: { findUnique: vi.fn() } },
}));

const getTokenMock = getToken as unknown as ReturnType<typeof vi.fn>;
const headersMock = headers as unknown as ReturnType<typeof vi.fn>;
const db = prisma as unknown as { usuario: { findUnique: Mock } };

beforeEach(() => {
  vi.clearAllMocks();
  headersMock.mockResolvedValue(new Headers());
});

describe("resolveIdentity — auth dual (cookie o Bearer)", () => {
  it("token válido (sub + ver) → identidad con rol de la DB", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.ADMIN, ver: 0 });
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      rol: ROLES.CLIENTE,
      tokenVersion: 0,
    });

    const identity = await resolveIdentity();
    expect(identity).toEqual({ userId: "u1", role: ROLES.CLIENTE });
  });

  it("sin token (ni cookie ni Bearer) → null", async () => {
    getTokenMock.mockResolvedValue(null);
    expect(await resolveIdentity()).toBeNull();
  });

  it("token marcado como invalid → null (revocación)", async () => {
    getTokenMock.mockResolvedValue({
      sub: "u1",
      role: ROLES.CLIENTE,
      ver: 0,
      invalid: true,
    });
    expect(await resolveIdentity()).toBeNull();
    expect(db.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("usuario eliminado → null", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.CLIENTE, ver: 0 });
    db.usuario.findUnique.mockResolvedValue(null);

    expect(await resolveIdentity()).toBeNull();
  });

  it("tokenVersion distinto → null (sesiones revocadas)", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.CLIENTE, ver: 0 });
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      rol: ROLES.CLIENTE,
      tokenVersion: 1,
    });

    expect(await resolveIdentity()).toBeNull();
  });

  it("token sin ver (emitido antes del cambio) → null", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.CLIENTE });
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      rol: ROLES.CLIENTE,
      tokenVersion: 0,
    });

    expect(await resolveIdentity()).toBeNull();
  });

  it("pasa los headers del request a getToken (Bearer)", async () => {
    const h = new Headers({ authorization: "Bearer jwt.abc.def" });
    headersMock.mockResolvedValue(h);
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.COMERCIO, ver: 0 });
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      rol: ROLES.COMERCIO,
      tokenVersion: 0,
    });

    await resolveIdentity();

    expect(getTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ req: { headers: h } }),
    );
  });
});

describe("requireClienteApi — autorización por rol vía Bearer", () => {
  it("sin identidad → 401", async () => {
    getTokenMock.mockResolvedValue(null);

    const access = await requireClienteApi();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.status).toBe(401);
  });

  it("rol no permitido (COMERCIO) → 403", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.COMERCIO, ver: 0 });
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      rol: ROLES.COMERCIO,
      tokenVersion: 0,
    });

    const access = await requireClienteApi();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.status).toBe(403);
  });

  it("rol permitido (CLIENTE) → ok con userId de la identidad", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.CLIENTE, ver: 0 });
    db.usuario.findUnique.mockResolvedValue({
      id: "u1",
      rol: ROLES.CLIENTE,
      tokenVersion: 0,
    });

    const access = await requireClienteApi();
    expect(access.ok).toBe(true);
    if (access.ok) {
      expect(access.userId).toBe("u1");
      expect(access.role).toBe(ROLES.CLIENTE);
    }
  });
});
