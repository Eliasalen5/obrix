import type { AiConfig } from "./config";
import { resolveAiConfig } from "./config";
import { DemoProvider } from "./demoProvider";
import { OpenAiProvider } from "./openaiProvider";
import type { AiProvider } from "./types";

export type { AiConfig } from "./config";
export type { AiProvider } from "./types";
export { resolveAiConfig } from "./config";
export {
  AiInvalidResponseError,
  AiProviderError,
  AiTimeoutError,
} from "./errors";

export function getAiProvider(config: AiConfig = resolveAiConfig()): AiProvider {
  return config.demo ? new DemoProvider() : new OpenAiProvider(config);
}
