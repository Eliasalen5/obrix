import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { verifyCredentials } from "@/lib/auth/credentials";
import { signSessionToken } from "@/lib/auth/signToken";
import { ROLES } from "@/lib/auth/constants";
import { POST } from "@/app/api/v1/auth/token/route";

vi.mock("@/lib/auth/credentials", () => ({
  verifyCredentials: vi.fn(),
}));

vi.mock("@/lib/auth/signToken", () => ({
  signSessionToken: vi.fn(),
}));

const verifyMock = verifyCredentials as unknown as ReturnType<typeof vi.fn>;
const signMock = signSessionToken as unknown as ReturnType<typeof vi.fn>;

function req(body: unknown) {
  return new Request("http://localhost/api/v1/auth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/v1/auth/token — emisión de token mobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signMock.mockResolvedValue({ token: "jwt.abc.def", expiresIn: 2592000 });
  });

  it("credenciales válidas → 200 con token y usuario (sin passwordHash)", async () => {
    verifyMock.mockResolvedValue({
      id: "u1",
      email: "ana@test.com",
      name: "Ana",
      role: ROLES.COMERCIO,
    });

    const res = await POST(req({ email: "ana@test.com", password: "secreta123" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.token).toBe("jwt.abc.def");
    expect(json.data.expiresIn).toBe(2592000);
    expect(json.data.user).toEqual({
      id: "u1",
      email: "ana@test.com",
      name: "Ana",
      role: ROLES.COMERCIO,
    });
    expect(json.data.user).not.toHaveProperty("passwordHash");
  });

  it("credenciales inválidas → 401 sin firmar token", async () => {
    verifyMock.mockResolvedValue(null);

    const res = await POST(req({ email: "ana@test.com", password: "mala" }));
    expect(res.status).toBe(401);
    expect(signMock).not.toHaveBeenCalled();

    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it("body no-JSON → 401 (no filtra stack)", async () => {
    verifyMock.mockResolvedValue(null);

    const res = await POST(req("no-json"));
    expect(res.status).toBe(401);
  });
});
