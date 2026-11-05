/**
 * Rate limiting con memoria local para desarrollo/tests y Upstash Redis para
 * producción.
 *
 * - Memoria: el estado vive en el proceso. Sirve para una única instancia o
 *   para tests, pero no es global en serverless.
 * - Upstash: contador atómico compartido entre todas las instancias. Se activa
 *   con `RATE_LIMIT_STORE=upstash` y las credenciales REST.
 * - Si el store falla, cada limiter decide entre fail-open (login/registro) o
 *   fail-closed (IA) mediante `onStoreError`.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const DEFAULT_LIMIT_PER_MIN = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
  degraded?: boolean;
};

export type RateLimitEntry = { count: number; resetAt: number };

export interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, value: RateLimitEntry): void;
  clear(): void;
}

export interface RateLimiterLike {
  check(key: string): Promise<RateLimitResult>;
  reset(): void;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private hits = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | undefined {
    return this.hits.get(key);
  }

  set(key: string, value: RateLimitEntry): void {
    this.hits.set(key, value);
  }

  clear(): void {
    this.hits.clear();
  }
}

export class RateLimiter implements RateLimiterLike {
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly store: RateLimitStore = new MemoryRateLimitStore(),
    private readonly now: () => number = () => Date.now(),
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    const t = this.now();
    const current = this.store.get(key);

    const expired = !current || t >= current.resetAt;
    const count = expired ? 0 : current.count;
    const resetAt = expired ? t + this.windowMs : current.resetAt;

    const next = count + 1;
    this.store.set(key, { count: next, resetAt });

    const allowed = next <= this.limit;
    return {
      allowed,
      limit: this.limit,
      remaining: Math.max(0, this.limit - next),
      retryAfterMs: allowed ? 0 : Math.max(0, resetAt - t),
    };
  }

  reset(): void {
    this.store.clear();
  }
}

type RateLimitErrorPolicy = "allow" | "deny";

export type RateLimiterConfig = {
  limit: number;
  windowMs: number;
  prefix: string;
  onStoreError: RateLimitErrorPolicy;
};

export class UpstashRateLimiter implements RateLimiterLike {
  private readonly ratelimit: Ratelimit;

  constructor(limit: number, windowMs: number, prefix: string, redis: Redis) {
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix,
    });
  }

  async check(key: string): Promise<RateLimitResult> {
    const result = await this.ratelimit.limit(key);
    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      retryAfterMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
    };
  }

  reset(): void {
    // El store compartido no se limpia desde la aplicación.
  }
}

class UnavailableRateLimiter implements RateLimiterLike {
  constructor(private readonly config: RateLimiterConfig) {}

  async check(): Promise<RateLimitResult> {
    return {
      allowed: this.config.onStoreError === "allow",
      limit: this.config.limit,
      remaining: 0,
      retryAfterMs: 0,
      degraded: true,
    };
  }

  reset(): void {}
}

class GuardedRateLimiter implements RateLimiterLike {
  private warned = false;

  constructor(
    private readonly inner: RateLimiterLike,
    private readonly config: RateLimiterConfig,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    try {
      return await this.inner.check(key);
    } catch (error) {
      if (!this.warned) {
        this.warned = true;
        console.error(`[rate-limit:${this.config.prefix}] store error`, error);
      }
      return {
        allowed: this.config.onStoreError === "allow",
        limit: this.config.limit,
        remaining: 0,
        retryAfterMs: 0,
        degraded: true,
      };
    }
  }

  reset(): void {
    this.inner.reset();
  }
}

type StoreResolution =
  | { kind: "memory" }
  | { kind: "upstash"; url: string; token: string }
  | { kind: "unavailable" };

export function resolveRateLimitStore(
  env: NodeJS.ProcessEnv = process.env,
): StoreResolution {
  const mode = env.RATE_LIMIT_STORE?.trim().toLowerCase();
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (mode === "memory") return { kind: "memory" };
  if (url && token) return { kind: "upstash", url, token };
  if (mode === "upstash") return { kind: "unavailable" };
  return { kind: "memory" };
}

export function createRateLimiter(
  config: RateLimiterConfig,
  env: NodeJS.ProcessEnv = process.env,
): RateLimiterLike {
  const store = resolveRateLimitStore(env);

  if (store.kind === "upstash") {
    const redis = new Redis({ url: store.url, token: store.token });
    return new GuardedRateLimiter(
      new UpstashRateLimiter(
        config.limit,
        config.windowMs,
        config.prefix,
        redis,
      ),
      config,
    );
  }

  if (store.kind === "unavailable") {
    console.error(
      `[rate-limit:${config.prefix}] RATE_LIMIT_STORE=upstash pero faltan UPSTASH_REDIS_REST_URL/TOKEN`,
    );
    return new UnavailableRateLimiter(config);
  }

  return new GuardedRateLimiter(
    new RateLimiter(config.limit, config.windowMs),
    config,
  );
}

export function resolveLimitPerMin(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = Number(env.RATE_LIMIT_PER_MIN);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT_PER_MIN;
  return Math.floor(raw);
}

export const asistenteRateLimiter = createRateLimiter({
  limit: resolveLimitPerMin(),
  windowMs: RATE_LIMIT_WINDOW_MS,
  prefix: "obrix:rl:asistente",
  onStoreError: "deny",
});

/**
 * Limiter para intentos de login (credenciales). Clave por email normalizado:
 * mitiga fuerza bruta / credential stuffing contra una cuenta. Límite más
 * estricto que el del asistente porque bcrypt es costoso en CPU.
 */
export const LOGIN_LIMIT_PER_MIN = 8;

export const loginRateLimiter = createRateLimiter({
  limit: resolveLoginLimitPerMin(),
  windowMs: RATE_LIMIT_WINDOW_MS,
  prefix: "obrix:rl:login",
  onStoreError: "allow",
});

export function resolveLoginLimitPerMin(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = Number(env.LOGIN_RATE_LIMIT_PER_MIN);
  if (!Number.isFinite(raw) || raw <= 0) return LOGIN_LIMIT_PER_MIN;
  return Math.floor(raw);
}

export const REGISTRO_LIMIT_PER_MIN = 5;

export const registroRateLimiter = createRateLimiter({
  limit: resolveRegistroLimitPerMin(),
  windowMs: RATE_LIMIT_WINDOW_MS,
  prefix: "obrix:rl:registro",
  onStoreError: "allow",
});

export function resolveRegistroLimitPerMin(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = Number(env.REGISTRO_RATE_LIMIT_PER_MIN);
  if (!Number.isFinite(raw) || raw <= 0) return REGISTRO_LIMIT_PER_MIN;
  return Math.floor(raw);
}
