import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  RateLimiter,
  MemoryRateLimitStore,
  resolveLimitPerMin,
  resolveLoginLimitPerMin,
  resolveRegistroLimitPerMin,
  resolveRateLimitStore,
  createRateLimiter,
  LOGIN_LIMIT_PER_MIN,
  REGISTRO_LIMIT_PER_MIN,
} from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("permite hasta el límite", async () => {
    const rl = new RateLimiter(2, 1000, new MemoryRateLimitStore(), () => 0);
    expect((await rl.check("u1")).allowed).toBe(true);
    expect((await rl.check("u1")).allowed).toBe(true);
    expect((await rl.check("u1")).allowed).toBe(false);
    expect((await rl.check("u1")).remaining).toBe(0);
  });

  it("resetea en nueva ventana", async () => {
    let t = 0;
    const rl = new RateLimiter(1, 1000, new MemoryRateLimitStore(), () => t);
    expect((await rl.check("u1")).allowed).toBe(true);
    expect((await rl.check("u1")).allowed).toBe(false);
    t = 1001;
    expect((await rl.check("u1")).allowed).toBe(true);
  });

  it("store inyectable es usado", async () => {
    const store: any = {
      get: vi.fn(() => undefined),
      set: vi.fn(),
      clear: vi.fn(),
    };
    const rl = new RateLimiter(5, 1000, store, () => 123);
    await rl.check("k");
    expect(store.get).toHaveBeenCalledWith("k");
    expect(store.set).toHaveBeenCalled();
  });

  it("resolveLimitPerMin usa default si inválido", () => {
    expect(resolveLimitPerMin({} as any)).toBe(10);
    expect(resolveLimitPerMin({ RATE_LIMIT_PER_MIN: "0" } as any)).toBe(10);
    expect(resolveLimitPerMin({ RATE_LIMIT_PER_MIN: "-5" } as any)).toBe(10);
    expect(resolveLimitPerMin({ RATE_LIMIT_PER_MIN: "3" } as any)).toBe(3);
  });

  it("resolveLoginLimitPerMin usa default y respeta override", () => {
    expect(resolveLoginLimitPerMin({} as any)).toBe(LOGIN_LIMIT_PER_MIN);
    expect(resolveLoginLimitPerMin({ LOGIN_RATE_LIMIT_PER_MIN: "0" } as any)).toBe(
      LOGIN_LIMIT_PER_MIN,
    );
    expect(
      resolveLoginLimitPerMin({ LOGIN_RATE_LIMIT_PER_MIN: "2" } as any),
    ).toBe(2);
  });

  it("resolveRegistroLimitPerMin usa default y respeta override", () => {
    expect(resolveRegistroLimitPerMin({} as any)).toBe(REGISTRO_LIMIT_PER_MIN);
    expect(
      resolveRegistroLimitPerMin({ REGISTRO_RATE_LIMIT_PER_MIN: "0" } as any),
    ).toBe(REGISTRO_LIMIT_PER_MIN);
    expect(
      resolveRegistroLimitPerMin({ REGISTRO_RATE_LIMIT_PER_MIN: "2" } as any),
    ).toBe(2);
  });
});

describe("resolución del store de rate limit", () => {
  it("usa memoria por defecto o cuando se pide explícitamente", () => {
    expect(resolveRateLimitStore({} as any)).toEqual({ kind: "memory" });
    expect(
      resolveRateLimitStore({ RATE_LIMIT_STORE: "memory" } as any),
    ).toEqual({ kind: "memory" });
  });

  it("usa Upstash si están las credenciales", () => {
    expect(
      resolveRateLimitStore({
        UPSTASH_REDIS_REST_URL: "https://redis.example",
        UPSTASH_REDIS_REST_TOKEN: "token",
      } as any),
    ).toEqual({
      kind: "upstash",
      url: "https://redis.example",
      token: "token",
    });
  });

  it("marca indisponible si se pide Upstash sin credenciales", () => {
    expect(
      resolveRateLimitStore({ RATE_LIMIT_STORE: "upstash" } as any),
    ).toEqual({ kind: "unavailable" });
  });

  it("fail-open cuando el store no está disponible", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rl = createRateLimiter(
      {
        limit: 5,
        windowMs: 60_000,
        prefix: "test:open",
        onStoreError: "allow",
      },
      { RATE_LIMIT_STORE: "upstash" } as any,
    );

    const result = await rl.check("k");
    expect(result.allowed).toBe(true);
    expect(result.degraded).toBe(true);
    errorSpy.mockRestore();
  });

  it("fail-closed cuando el store no está disponible", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rl = createRateLimiter(
      {
        limit: 5,
        windowMs: 60_000,
        prefix: "test:closed",
        onStoreError: "deny",
      },
      { RATE_LIMIT_STORE: "upstash" } as any,
    );

    const result = await rl.check("k");
    expect(result.allowed).toBe(false);
    expect(result.degraded).toBe(true);
    errorSpy.mockRestore();
  });
});
