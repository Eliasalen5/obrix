import { describe, it, expect, vi, beforeEach } from "vitest";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { resolveIdentity } from "@/lib/auth/token";
import { requireClienteApi } from "@/lib/auth/apiAuth";
import { ROLES } from "@/lib/auth/constants";

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

const getTokenMock = getToken as unknown as ReturnType<typeof vi.fn>;
const headersMock = headers as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  headersMock.mockResolvedValue(new Headers());
});

describe("resolveIdentity — auth dual (cookie o Bearer)", () => {
  it("token válido (sub + role) → identidad", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.CLIENTE });

    const identity = await resolveIdentity();
    expect(identity).toEqual({ userId: "u1", role: ROLES.CLIENTE });
  });

  it("sin token (ni cookie ni Bearer) → null", async () => {
    getTokenMock.mockResolvedValue(null);
    expect(await resolveIdentity()).toBeNull();
  });

  it("token marcado como invalid (usuario eliminado) → null (revocación)", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.CLIENTE, invalid: true });
    expect(await resolveIdentity()).toBeNull();
  });

  it("token sin rol → null", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1" });
    expect(await resolveIdentity()).toBeNull();
  });

  it("pasa los headers del request a getToken (Bearer)", async () => {
    const h = new Headers({ authorization: "Bearer jwt.abc.def" });
    headersMock.mockResolvedValue(h);
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.COMERCIO });

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
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.COMERCIO });

    const access = await requireClienteApi();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.status).toBe(403);
  });

  it("rol permitido (CLIENTE) → ok con userId de la identidad", async () => {
    getTokenMock.mockResolvedValue({ sub: "u1", role: ROLES.CLIENTE });

    const access = await requireClienteApi();
    expect(access.ok).toBe(true);
    if (access.ok) {
      expect(access.userId).toBe("u1");
      expect(access.role).toBe(ROLES.CLIENTE);
    }
  });
});
