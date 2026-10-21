import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  RateLimiter,
  MemoryRateLimitStore,
  resolveLimitPerMin,
  resolveLoginLimitPerMin,
  LOGIN_LIMIT_PER_MIN,
} from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("permite hasta el límite", () => {
    const rl = new RateLimiter(2, 1000, new MemoryRateLimitStore(), () => 0);
    expect(rl.check("u1").allowed).toBe(true);
    expect(rl.check("u1").allowed).toBe(true);
    expect(rl.check("u1").allowed).toBe(false);
    expect(rl.check("u1").remaining).toBe(0);
  });

  it("resetea en nueva ventana", () => {
    let t = 0;
    const rl = new RateLimiter(1, 1000, new MemoryRateLimitStore(), () => t);
    expect(rl.check("u1").allowed).toBe(true);
    expect(rl.check("u1").allowed).toBe(false);
    t = 1001;
    expect(rl.check("u1").allowed).toBe(true);
  });

  it("store inyectable es usado", () => {
    const store: any = {
      get: vi.fn(() => undefined),
      set: vi.fn(),
      clear: vi.fn(),
    };
    const rl = new RateLimiter(5, 1000, store, () => 123);
    rl.check("k");
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
});
