import { describe, it, expect, vi } from "vitest";
import { DemoProvider } from "@/lib/ai/demoProvider";
import {
  AiInvalidResponseError,
  AiTimeoutError,
} from "@/lib/ai/errors";
import { OpenAiProvider, type FetchLike } from "@/lib/ai/openaiProvider";
import { interpretarBusqueda } from "@/lib/services/busquedaIa.service";
import { normalizarClave } from "@/lib/text/busqueda";

describe("demoProvider.interpretarBusqueda", () => {
  it("interpreta intención de impermeabilizar una terraza", async () => {
    const p = new DemoProvider();
    const r = (await p.interpretarBusqueda(
      "Necesito una pintura para impermeabilizar una terraza",
    )) as { terminos: string; categoria?: string };
    expect(r.terminos).toBe("impermeabilizante membrana");
    expect(r.categoria).toBe("Pinturerías");
  });

  it("interpreta tornillería", async () => {
    const p = new DemoProvider();
    const r = (await p.interpretarBusqueda("tornillos autoperforantes")) as {
      terminos: string;
      categoria?: string;
    };
    expect(r.categoria).toBe("Ferreterías");
  });

  it("sin regla conocida devuelve la consulta normalizada", async () => {
    const p = new DemoProvider();
    const consulta = "Árido especial Ñandú";
    const r = (await p.interpretarBusqueda(consulta)) as { terminos: string };
    expect(r.terminos).toBe(normalizarClave(consulta));
  });
});

describe("openaiProvider.interpretarBusqueda", () => {
  it("extrae el JSON de términos y categoría", async () => {
    const body = { terminos: "impermeabilizante membrana", categoria: "Pinturerías" };
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
    const r = await p.interpretarBusqueda(
      "pintura para terraza",
      new AbortController().signal,
    );
    expect(r).toEqual(body);
  });
});

describe("busquedaIa.service", () => {
  it("devuelve modo demo con el provider demo", async () => {
    const res = await interpretarBusqueda(
      "pintura para impermeabilizar terraza",
      new DemoProvider(),
      { timeoutMs: 5000 },
    );
    expect(res.modo).toBe("demo");
    expect(res.terminos).toBe("impermeabilizante membrana");
    expect(res.categoria).toBe("Pinturerías");
  });

  it("lanza timeout si el provider demora", async () => {
    const p: any = {
      nombre: "test",
      esDemo: false,
      interpretarBusqueda: async (_: string, sig: AbortSignal) =>
        new Promise((_, rej) => {
          sig.addEventListener("abort", () => rej(new Error("abort")));
        }),
    };
    await expect(
      interpretarBusqueda("cemento", p, { timeoutMs: 10 }),
    ).rejects.toThrow(AiTimeoutError);
  });

  it("lanza invalid response si la salida no valida", async () => {
    const p: any = {
      nombre: "test",
      esDemo: false,
      interpretarBusqueda: async () => ({ foo: "bar" }),
    };
    await expect(
      interpretarBusqueda("cemento", p, { timeoutMs: 5000 }),
    ).rejects.toThrow(AiInvalidResponseError);
  });
});
