import { describe, it, expect, vi } from "vitest";
import { DemoProvider } from "@/lib/ai/demoProvider";
import {
  AiInvalidResponseError,
  AiProviderError,
  AiTimeoutError,
} from "@/lib/ai/errors";
import { OpenAiProvider, type FetchLike } from "@/lib/ai/openaiProvider";
import { getAiProvider, resolveAiConfig } from "@/lib/ai";
import { generarProyecto } from "@/lib/services/asistente.service";
import { asistenteResponseSchema } from "@/lib/validators/asistente";

describe("demoProvider", () => {
  it("devuelve estimación en modo demo", async () => {
    const p = new DemoProvider();
    const r = await p.generarProyecto("quiero hacer una parrilla de 1,5 m");
    expect(typeof r).toBe("object");
    const parsed = asistenteResponseSchema.safeParse({
      ...(r as any),
      esEstimacion: true,
      modo: "demo",
      aviso: "Respuesta simulada (modo demo)",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("openaiProvider", () => {
  it("extrae contenido JSON válido", async () => {
    const body = {
      titulo: "Parrilla",
      materiales: [{ nombre: "Ladrillo", cantidad: 10, unidad: "unidad" }],
      supuestos: [],
      aclaraciones: ["Estimación orientativa"],
    };
    const mockFetch: FetchLike = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(body) } }],
        }),
      } as any;
    });
    const p = new OpenAiProvider(
      { demo: false, model: "m", baseUrl: "http://x/v1", timeoutMs: 5000 },
      mockFetch,
    );
    const r = await p.generarProyecto("parrilla", new AbortController().signal);
    expect(r).toEqual(body);
  });

  it("lanza AiProviderError si res no ok", async () => {
    const mockFetch: FetchLike = vi.fn(async () => {
      return { ok: false, status: 500 } as any;
    });
    const p = new OpenAiProvider(
      { demo: false, model: "m", baseUrl: "http://x/v1", timeoutMs: 5000 },
      mockFetch,
    );
    await expect(
      p.generarProyecto("x", new AbortController().signal),
    ).rejects.toThrow(AiProviderError);
  });

  it("lanza AiProviderError si JSON parse falla", async () => {
    const mockFetch: FetchLike = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: "{no-json}" } }] }),
      } as any;
    });
    const p = new OpenAiProvider(
      { demo: false, model: "m", baseUrl: "http://x/v1", timeoutMs: 5000 },
      mockFetch,
    );
    await expect(
      p.generarProyecto("x", new AbortController().signal),
    ).rejects.toThrow(AiProviderError);
  });
});

describe("factory", () => {
  it("elige demo si falta api key", () => {
    const p = getAiProvider(resolveAiConfig({ IA_DEMO: "true" } as any));
    expect(p.esDemo).toBe(true);
  });

  it("elige real si hay api key y demo false", () => {
    const p = getAiProvider(
      resolveAiConfig({ IA_API_KEY: "k", IA_DEMO: "false" } as any),
    );
    expect(p.esDemo).toBe(false);
  });
});

describe("servicio", () => {
  it("agrega aviso de estimación", async () => {
    const p = new DemoProvider();
    const res = await generarProyecto("parrilla 1.5m", p, { timeoutMs: 5000 });
    expect(res.esEstimacion).toBe(true);
    expect(res.modo).toBe("demo");
    expect(res.aviso).toBeDefined();
  });

  it("lanza timeout si provider demora", async () => {
    const p: any = {
      nombre: "test",
      esDemo: false,
      generarProyecto: async (_: string, sig: AbortSignal) => {
        return new Promise((_, rej) => {
          sig.addEventListener("abort", () => rej(new Error("abort")));
        });
      },
    };
    await expect(
      generarProyecto("x", p, { timeoutMs: 10 }),
    ).rejects.toThrow(AiTimeoutError);
  });

  it("lanza invalid response si salida no valida", async () => {
    const p: any = {
      nombre: "test",
      esDemo: false,
      generarProyecto: async () => ({ foo: "bar" }),
    };
    await expect(
      generarProyecto("x", p, { timeoutMs: 5000 }),
    ).rejects.toThrow(AiInvalidResponseError);
  });
});
