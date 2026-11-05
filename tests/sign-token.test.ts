import { describe, it, expect } from "vitest";
import { decode } from "next-auth/jwt";
import { ROLES } from "@/lib/auth/constants";

describe("signSessionToken — claims del token mobile", () => {
  it("incluye tokenVersion en el claim ver", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const { signSessionToken } = await import("@/lib/auth/signToken");

    const { token, expiresIn } = await signSessionToken({
      id: "u1",
      email: "ana@test.com",
      name: "Ana",
      role: ROLES.CLIENTE,
      tokenVersion: 3,
    });

    const decoded = await decode({ token, secret: "test-secret" });
    expect(decoded).toMatchObject({
      sub: "u1",
      email: "ana@test.com",
      name: "Ana",
      role: ROLES.CLIENTE,
      ver: 3,
    });
    expect(expiresIn).toBe(30 * 24 * 60 * 60);
  });
});
