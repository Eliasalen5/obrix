import type { AiConfig } from "./config";
import { AiProviderError } from "./errors";
import {
  BUSQUEDA_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  VISION_SYSTEM_PROMPT,
} from "./prompt";
import type { AiProvider } from "./types";

export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

type ContenidoUsuario =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" } }
    >;

export class OpenAiProvider implements AiProvider {
  readonly nombre = "openai";
  readonly esDemo = false;

  constructor(
    private readonly config: AiConfig,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  generarProyecto(descripcion: string, signal: AbortSignal): Promise<unknown> {
    return this.completarJson(SYSTEM_PROMPT, descripcion, signal);
  }

  interpretarBusqueda(consulta: string, signal: AbortSignal): Promise<unknown> {
    return this.completarJson(BUSQUEDA_SYSTEM_PROMPT, consulta, signal);
  }

  identificarImagen(
    imagenBase64: string,
    mime: string,
    signal: AbortSignal,
  ): Promise<unknown> {
    return this.completarJson(
      VISION_SYSTEM_PROMPT,
      [
        {
          type: "text",
          text: "Analizá esta fotografía y devolvé la identificación en el formato pedido.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mime};base64,${imagenBase64}`,
            detail: "high",
          },
        },
      ],
      signal,
    );
  }

  private async completarJson(
    systemPrompt: string,
    userContent: ContenidoUsuario,
    signal: AbortSignal,
  ): Promise<unknown> {
    const res = await this.fetchImpl(
      `${this.config.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.config.apiKey ?? ""}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        }),
        signal,
      },
    );

    if (!res.ok) {
      throw new AiProviderError(
        `El proveedor de IA respondió con estado ${res.status}`,
        res.status,
      );
    }

    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      throw new AiProviderError("El proveedor de IA devolvió una respuesta ilegible");
    }

    const content = (payload as { choices?: { message?: { content?: unknown } }[] })
      ?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || content.trim() === "") {
      throw new AiProviderError("El proveedor de IA no devolvió contenido");
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new AiProviderError("El proveedor de IA devolvió JSON inválido");
    }
  }
}
