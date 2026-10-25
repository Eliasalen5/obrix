/**
 * Rate limiting en memoria (ventana fija) por clave (típicamente usuario o IP).
 *
 * LIMITACIONES DEL ALMACENAMIENTO LOCAL:
 * - El estado vive en el proceso de Node: es por instancia y se pierde al
 *   reiniciar. En despliegues con varias instancias o serverless (cada request
 *   puede caer en un proceso distinto) el límite real es "por instancia", no
 *   global. Para producción multi-instancia, reemplazar `MemoryRateLimitStore`
 *   por un store compartido (Redis/Upstash) implementando `RateLimitStore`.
 * - No hay limpieza automática de claves vencidas; para volúmenes grandes
 *   conviene un store con TTL o un barrido periódico.
 */
export const DEFAULT_LIMIT_PER_MIN = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
};

export type RateLimitEntry = { count: number; resetAt: number };

export interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, value: RateLimitEntry): void;
  clear(): void;
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

export class RateLimiter {
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly store: RateLimitStore = new MemoryRateLimitStore(),
    private readonly now: () => number = () => Date.now(),
  ) {}

  check(key: string): RateLimitResult {
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

export function resolveLimitPerMin(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = Number(env.RATE_LIMIT_PER_MIN);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT_PER_MIN;
  return Math.floor(raw);
}

export const asistenteRateLimiter = new RateLimiter(
  resolveLimitPerMin(),
  RATE_LIMIT_WINDOW_MS,
);

/**
 * Limiter para intentos de login (credenciales). Clave por email normalizado:
 * mitiga fuerza bruta / credential stuffing contra una cuenta. Límite más
 * estricto que el del asistente porque bcrypt es costoso en CPU.
 */
export const LOGIN_LIMIT_PER_MIN = 8;

export const loginRateLimiter = new RateLimiter(
  resolveLoginLimitPerMin(),
  RATE_LIMIT_WINDOW_MS,
);

export function resolveLoginLimitPerMin(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = Number(env.LOGIN_RATE_LIMIT_PER_MIN);
  if (!Number.isFinite(raw) || raw <= 0) return LOGIN_LIMIT_PER_MIN;
  return Math.floor(raw);
}

export const REGISTRO_LIMIT_PER_MIN = 5;

export const registroRateLimiter = new RateLimiter(
  resolveRegistroLimitPerMin(),
  RATE_LIMIT_WINDOW_MS,
);

export function resolveRegistroLimitPerMin(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = Number(env.REGISTRO_RATE_LIMIT_PER_MIN);
  if (!Number.isFinite(raw) || raw <= 0) return REGISTRO_LIMIT_PER_MIN;
  return Math.floor(raw);
}
