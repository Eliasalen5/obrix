import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { DemoProvider } from "@/lib/ai/demoProvider";
import { resolveLimitPerMin, visionRateLimiter } from "@/lib/rate-limit";
import { IMAGEN_MAX_BYTES } from "@/lib/validators/vision";
import * as vision from "@/app/api/v1/vision/route";

const mocks = vi.hoisted(() => ({
  getAiProvider: vi.fn(),
  timeoutMs: 2000,
}));

vi.mock("@/lib/ai", () => ({
  getAiProvider: mocks.getAiProvider,
  resolveAiConfig: () => ({
    demo: true,
    model: "test",
    baseUrl: "http://test",
    timeoutMs: mocks.timeoutMs,
  }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/ofertas/buscarOfertas", () => ({
  buscarOfertasPublicas: vi.fn(async () => []),
}));

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function archivo() {
  return new File([PNG], "tornillo.png", { type: "image/png" });
}

function req(imagen: File | null = archivo(), ip = "1.1.1.1") {
  const form = new FormData();
  if (imagen) form.append("imagen", imagen);
  return new Request("http://localhost/api/v1/vision", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: form,
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.timeoutMs = 2000;
  mocks.getAiProvider.mockReturnValue(new DemoProvider());
  visionRateLimiter.reset();
});

describe("vision — entrada", () => {
  it("identifica sin exigir sesión", async () => {
    const res = await vision.POST(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.identificacion.objeto).toBe("Tornillo");
    expect(body.data.identificacion.confianza).toBe("probable");
    expect(body.data.modo).toBe("demo");
    expect(body.data.ofertas).toEqual([]);
  });

  it("exige una fotografía", async () => {
    expect((await vision.POST(req(null))).status).toBe(400);
  });

  it("rechaza MIME no permitidos y contenido disfrazado", async () => {
    const texto = new File(["hola"], "a.txt", { type: "text/plain" });
    expect((await vision.POST(req(texto))).status).toBe(400);

    const falso = new File(["no-soy-imagen"], "a.png", { type: "image/png" });
    expect((await vision.POST(req(falso))).status).toBe(400);
  });

  it("rechaza archivos mayores a 4 MB", async () => {
    const grande = new File([new Uint8Array(IMAGEN_MAX_BYTES + 1)], "a.png", {
      type: "image/png",
    });
    expect((await vision.POST(req(grande))).status).toBe(400);
  });
});

describe("vision — errores de IA", () => {
  it("provider error → 502", async () => {
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      identificarImagen: vi.fn(async () => {
        throw new AiProviderError("boom");
      }),
    });
    expect((await vision.POST(req())).status).toBe(502);
  });

  it("timeout → 504", async () => {
    mocks.timeoutMs = 10;
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      identificarImagen: (_b: string, _m: string, signal: AbortSignal) =>
        new Promise((_r, reject) => {
          signal.addEventListener("abort", () => reject(new Error("abort")));
        }),
    });
    expect((await vision.POST(req())).status).toBe(504);
  });

  it("respuesta inválida → 502", async () => {
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      identificarImagen: async () => ({ objeto: "Tornillo" }),
    });
    expect((await vision.POST(req())).status).toBe(502);
  });
});

describe("vision — rate limiting", () => {
  it("aplica cupo por IP", async () => {
    const limite = resolveLimitPerMin();
    for (let i = 0; i < limite; i++) {
      expect((await vision.POST(req())).status).toBe(200);
    }
    expect((await vision.POST(req())).status).toBe(429);
    expect((await vision.POST(req(archivo(), "2.2.2.2"))).status).toBe(200);
  });

  it("falla cerrado si el store está degradado", async () => {
    const spy = vi.spyOn(visionRateLimiter, "check").mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterMs: 0,
      degraded: true,
    });
    expect((await vision.POST(req())).status).toBe(503);
    spy.mockRestore();
  });
});
