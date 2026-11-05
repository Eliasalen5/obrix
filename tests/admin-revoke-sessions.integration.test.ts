import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { resolveIdentity } from "@/lib/auth/token";
import { revokeUserSessions } from "@/lib/services/auth.service";
import { ROLES, type Role } from "@/lib/auth/constants";

import { POST } from "@/app/api/v1/admin/usuarios/[id]/revocar-sesiones/route";

vi.mock("@/lib/auth/token", () => ({ resolveIdentity: vi.fn() }));
vi.mock("@/lib/services/auth.service", () => ({
  revokeUserSessions: vi.fn(),
}));

const sessionMock = resolveIdentity as unknown as Mock;
const revokeMock = revokeUserSessions as unknown as Mock;

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function req() {
  return new Request(
    "http://localhost/api/v1/admin/usuarios/u1/revocar-sesiones",
    { method: "POST" },
  ) as unknown as NextRequest;
}

function withRole(role: Role) {
  sessionMock.mockResolvedValue({ userId: "admin1", role });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/v1/admin/usuarios/[id]/revocar-sesiones", () => {
  it("sin sesión → 401", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await POST(req(), ctx("u1"));
    expect(res.status).toBe(401);
    expect(revokeMock).not.toHaveBeenCalled();
  });

  it("con rol no admin → 403", async () => {
    withRole(ROLES.COMERCIO as Role);
    const res = await POST(req(), ctx("u1"));
    expect(res.status).toBe(403);
    expect(revokeMock).not.toHaveBeenCalled();
  });

  it("admin revoca sesiones → 200 e incrementa tokenVersion", async () => {
    withRole(ROLES.ADMIN as Role);
    revokeMock.mockResolvedValue({ id: "u1", tokenVersion: 2 });

    const res = await POST(req(), ctx("u1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: { id: "u1", tokenVersion: 2 },
    });
    expect(revokeMock).toHaveBeenCalledWith("u1");
  });

  it("usuario inexistente (P2025) → 404", async () => {
    withRole(ROLES.ADMIN as Role);
    revokeMock.mockRejectedValue(
      Object.assign(new Error("not found"), { code: "P2025" }),
    );

    const res = await POST(req(), ctx("nope"));
    expect(res.status).toBe(404);
  });
});
