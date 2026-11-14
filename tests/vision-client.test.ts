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
    expect(init.headers).toBeUndefined();
  });
});
