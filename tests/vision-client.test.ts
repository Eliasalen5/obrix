import { afterEach, describe, expect, it, vi } from "vitest";
import { resetHttp } from "@/lib/api/httpClient";
import { visionApi } from "@/lib/api/visionClient";

afterEach(() => {
  resetHttp();
  vi.unstubAllGlobals();
});

describe("visionApi.identificar", () => {
  it("sube multipart sin forzar content-type application/json", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          identificacion: {
            objeto: "Tornillo",
            tipo: "Autoperforante",
            caracteristicas: [],
            incertidumbres: ["Medidas"],
            confianza: "probable",
            terminos: "tornillo",
            categoria: "Ferreterías",
          },
          modo: "demo",
          ofertas: [],
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await visionApi.identificar(
      new File([new Uint8Array([1])], "foto.png", { type: "image/png" }),
      "Sujetar chapa en el techo",
    );

    expect(result.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/v1/vision");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("imagen")).toBeInstanceOf(File);
    expect((init.body as FormData).get("detalle")).toBe(
      "Sujetar chapa en el techo",
    );
    expect(init.headers).toBeUndefined();
  });
});

describe("visionApi.consultar", () => {
  it("envía la pregunta y el contexto como JSON al endpoint /consulta", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          respuesta: "Encontré 1 producto.",
          modo: "demo",
          ofertas: [],
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await visionApi.consultar({
      pregunta: "¿Tenés uno más largo?",
      contexto: {
        identificacion: {
          objeto: "Tornillo",
          tipo: "Autoperforante",
          caracteristicas: [],
          incertidumbres: ["Medidas"],
          confianza: "probable",
          terminos: "tornillo",
          categoria: "Ferreterías",
        },
        detalle: "Sujetar chapa",
      },
    });

    expect(result.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/v1/vision/consulta");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.pregunta).toBe("¿Tenés uno más largo?");
    expect(body.contexto.identificacion.objeto).toBe("Tornillo");
    expect(body.contexto.detalle).toBe("Sujetar chapa");
  });
});
