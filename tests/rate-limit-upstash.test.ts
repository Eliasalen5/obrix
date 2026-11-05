import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const limit = vi.fn();
  const slidingWindow = vi.fn((limitPerWindow: number, window: string) => ({
    limitPerWindow,
    window,
  }));
  const Ratelimit = vi.fn();
  const Redis = vi.fn();
  return { limit, slidingWindow, Ratelimit, Redis };
});

vi.mock("@upstash/ratelimit", () => {
  (mocks.Ratelimit as any).slidingWindow = mocks.slidingWindow;
  return { Ratelimit: mocks.Ratelimit };
});

vi.mock("@upstash/redis", () => ({ Redis: mocks.Redis }));

import { createRateLimiter } from "@/lib/rate-limit";

const ENV = {
  RATE_LIMIT_STORE: "upstash",
  UPSTASH_REDIS_REST_URL: "https://redis.example",
  UPSTASH_REDIS_REST_TOKEN: "token",
} as any;

function config(onStoreError: "allow" | "deny") {
  return {
    limit: 8,
    windowMs: 60_000,
    prefix: "test:upstash",
    onStoreError,
  };
}

describe("rate-limit con Upstash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue({
      success: true,
      limit: 8,
      remaining: 7,
      reset: Date.now() + 60_000,
    });
    mocks.Redis.mockImplementation(function (this: any, options: any) {
      this.options = options;
    });
    mocks.Ratelimit.mockImplementation(function (this: any, options: any) {
      this.options = options;
      this.limit = mocks.limit;
    });
  });

  it("crea el cliente con las credenciales y usa ventana deslizante", async () => {
    const rl = createRateLimiter(config("deny"), ENV);

    expect(mocks.Redis).toHaveBeenCalledWith({
      url: "https://redis.example",
      token: "token",
    });
    expect(mocks.slidingWindow).toHaveBeenCalledWith(8, "60 s");

    const result = await rl.check("clave");
    expect(result).toEqual({
      allowed: true,
      limit: 8,
      remaining: 7,
      retryAfterMs: 0,
    });
    expect(mocks.limit).toHaveBeenCalledWith("clave");
  });

  it("mapea el bloqueo y calcula retryAfterMs", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      limit: 8,
      remaining: 0,
      reset: Date.now() + 30_000,
    });
    const rl = createRateLimiter(config("deny"), ENV);

    const result = await rl.check("clave");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(30_000);
  });

  it("fail-closed si Upstash falla", async () => {
    mocks.limit.mockRejectedValue(new Error("redis down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rl = createRateLimiter(config("deny"), ENV);

    const result = await rl.check("clave");
    expect(result).toMatchObject({ allowed: false, degraded: true });
    errorSpy.mockRestore();
  });

  it("fail-open si Upstash falla", async () => {
    mocks.limit.mockRejectedValue(new Error("redis down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rl = createRateLimiter(config("allow"), ENV);

    const result = await rl.check("clave");
    expect(result).toMatchObject({ allowed: true, degraded: true });
    errorSpy.mockRestore();
  });
});
