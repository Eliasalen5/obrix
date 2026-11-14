import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { busquedaIaRateLimiter, resolveLimitPerMin } from "@/lib/rate-limit";
import { AiProviderError } from "@/lib/ai/errors";
import * as busqueda from "@/app/api/v1/busqueda-ia/route";

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

function proveedorDemo() {
  return {
    nombre: "demo",
    esDemo: true,
    interpretarBusqueda: vi.fn(async () => ({
      terminos: "impermeabilizante membrana",
      categoria: "Pinturerías",
    })),
  };
}

function req(body: unknown, ip = "1.1.1.1") {
  return new Request("http://localhost/api/busqueda-ia", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.timeoutMs = 2000;
  mocks.getAiProvider.mockReturnValue(proveedorDemo());
  busquedaIaRateLimiter.reset();
});

describe("busqueda-ia — validación", () => {
  it("éxito → 200 con términos y modo demo (sin sesión requerida)", async () => {
    const res = await busqueda.POST(
      req({ consulta: "pintura para impermeabilizar una terraza" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.terminos).toBe("impermeabilizante membrana");
    expect(body.data.categoria).toBe("Pinturerías");
    expect(body.data.modo).toBe("demo");
  });

  it("consulta demasiado corta → 400", async () => {
    const res = await busqueda.POST(req({ consulta: "ab" }));
    expect(res.status).toBe(400);
  });

  it("JSON inválido → 400", async () => {
    const res = await busqueda.POST(req("{no-json"));
    expect(res.status).toBe(400);
  });
});

describe("busqueda-ia — errores del proveedor", () => {
  it("provider error → 502", async () => {
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      interpretarBusqueda: vi.fn(async () => {
        throw new AiProviderError("boom");
      }),
    });
    const res = await busqueda.POST(req({ consulta: "cemento" }));
    expect(res.status).toBe(502);
  });

  it("timeout → 504", async () => {
    mocks.timeoutMs = 10;
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      interpretarBusqueda: (_c: string, signal: AbortSignal) =>
        new Promise((_r, reject) => {
          signal.addEventListener("abort", () => reject(new Error("abort")));
        }),
    });
    const res = await busqueda.POST(req({ consulta: "cemento" }));
    expect(res.status).toBe(504);
  });

  it("respuesta inválida → 502", async () => {
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      interpretarBusqueda: vi.fn(async () => ({ foo: "bar" })),
    });
    const res = await busqueda.POST(req({ consulta: "cemento" }));
    expect(res.status).toBe(502);
  });
});

describe("busqueda-ia — rate limiting por IP", () => {
  it("rechaza con 429 al superar el límite", async () => {
    const limite = resolveLimitPerMin();
    const body = { consulta: "cemento" };

    for (let i = 0; i < limite; i++) {
      const ok = await busqueda.POST(req(body));
      expect(ok.status).toBe(200);
    }

    const res = await busqueda.POST(req(body));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).not.toBeNull();
  });

  it("cada IP tiene su propio cupo", async () => {
    const limite = resolveLimitPerMin();
    const body = { consulta: "cemento" };
    for (let i = 0; i < limite; i++) await busqueda.POST(req(body));
    expect((await busqueda.POST(req(body))).status).toBe(429);

    expect((await busqueda.POST(req(body, "2.2.2.2"))).status).toBe(200);
  });

  it("responde 503 si el store compartido no está disponible", async () => {
    const spy = vi.spyOn(busquedaIaRateLimiter, "check").mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterMs: 0,
      degraded: true,
    });

    const res = await busqueda.POST(req({ consulta: "cemento" }));
    expect(res.status).toBe(503);
    spy.mockRestore();
  });
});
