export const DEFAULT_MODEL = "gpt-4o-mini";
export const DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_TIMEOUT_MS = 15_000;

export type AiConfig = {
  demo: boolean;
  apiKey?: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
};

function parseTimeout(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.floor(n);
}

export function resolveAiConfig(
  env: NodeJS.ProcessEnv = process.env,
): AiConfig {
  const apiKey = env.IA_API_KEY?.trim() || undefined;
  const demo = env.IA_DEMO === "true" || !apiKey;

  return {
    demo,
    apiKey,
    model: env.IA_MODEL?.trim() || DEFAULT_MODEL,
    baseUrl: (env.IA_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    timeoutMs: parseTimeout(env.IA_TIMEOUT_MS),
  };
}
