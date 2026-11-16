import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { AiProviderError } from "@/lib/ai/errors";
import { DemoProvider } from "@/lib/ai/demoProvider";
import { visionRateLimiter } from "@/lib/rate-limit";
import { responderConsulta } from "@/lib/services/visionConsulta.service";
import * as consultaRoute from "@/app/api/v1/vision/consulta/route";

const mocks = vi.hoisted(() => ({
  buscarOfertasPublicas: vi.fn(),
  getAiProvider: vi.fn(),
  timeoutMs: 2000,
}));

vi.mock("@/lib/ofertas/buscarOfertas", () => ({
  buscarOfertasPublicas: mocks.buscarOfertasPublicas,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/ai", () => ({
  getAiProvider: mocks.getAiProvider,
  resolveAiConfig: () => ({
    demo: true,
    model: "test",
    baseUrl: "http://test",
    timeoutMs: mocks.timeoutMs,
  }),
}));

const IDENTIFICACION = {
  objeto: "Tornillo",
  tipo: "Autoperforante",
  caracteristicas: ["Cabeza hexagonal aparente"],
  incertidumbres: ["Medidas"],
  confianza: "probable" as const,
  terminos: "tornillo",
  categoria: "Ferreterías",
};

const OFERTA = {
  id: "o1",
  precio: 100,
  stock: 5,
  marca: "X",
  presentacion: "",
  producto: {
    nombre: "Tornillo acero",
    descripcion: "d",
    busqueda: "tornillo acero",
    unidad: "unidad",
    marca: "X",
    categoria: { nombre: "Ferreterías" },
  },
  comercio: { nombre: "C", direccion: "", localidad: "", provincia: "" },
};

const REQUEST = {
  pregunta: "¿Hay una versión de acero inoxidable?",
  contexto: { identificacion: IDENTIFICACION, detalle: "Sujetar chapa" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.timeoutMs = 2000;
  mocks.buscarOfertasPublicas.mockResolvedValue([]);
  mocks.getAiProvider.mockReturnValue(new DemoProvider());
  visionRateLimiter.reset();
});

function req(body: unknown, ip = "1.1.1.1"): NextRequest {
  return new Request("http://localhost/api/v1/vision/consulta", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("visionConsulta.service", () => {
  it("interpreta, busca en el catálogo y compone la respuesta con resultados", async () => {
    mocks.buscarOfertasPublicas.mockResolvedValue([OFERTA]);
    const provider: any = {
      nombre: "x",
      esDemo: false,
      responderConsultaImagen: vi.fn(async () => ({
        interpretacion: "Buscás tornillos de acero inoxidable.",
        terminos: "tornillo acero",
        categoria: "Ferreterías",
      })),
    };

    const res = await responderConsulta(REQUEST, provider, { timeoutMs: 5000 });

    expect(provider.responderConsultaImagen).toHaveBeenCalledWith(
      REQUEST.pregunta,
      expect.objectContaining({ objeto: "Tornillo", terminos: "tornillo" }),
      expect.any(AbortSignal),
    );
    expect(mocks.buscarOfertasPublicas).toHaveBeenCalledWith({
      q: "tornillo acero",
      categoria: "Ferreterías",
      take: 24,
    });
    expect(res.respuesta).toContain("Encontré");
    expect(res.ofertas[0]).toMatchObject({ id: "o1", nivel: "alta" });
  });

  it("responde que no hay coincidencias cuando el catálogo está vacío", async () => {
    const provider: any = {
      nombre: "x",
      esDemo: false,
      responderConsultaImagen: async () => ({
        interpretacion: "Buscás una variante inexistente.",
        terminos: "xyz",
      }),
    };
    const res = await responderConsulta(REQUEST, provider, { timeoutMs: 5000 });
    expect(res.ofertas).toEqual([]);
    expect(res.respuesta).toContain("No encontré");
  });

  it("ignora una categoría inválida del proveedor y usa la del contexto", async () => {
    const provider: any = {
      nombre: "x",
      esDemo: false,
      responderConsultaImagen: async () => ({
        interpretacion: "x",
        terminos: "tornillo",
        categoria: "Inventada",
      }),
    };
    await responderConsulta(REQUEST, provider, { timeoutMs: 5000 });
    expect(mocks.buscarOfertasPublicas).toHaveBeenCalledWith({
      q: "tornillo",
      categoria: "Ferreterías",
      take: 24,
    });
  });

  it("lanza error si la salida del proveedor es inválida", async () => {
    const provider: any = {
      nombre: "x",
      esDemo: false,
      responderConsultaImagen: async () => ({ nada: true }),
    };
    await expect(
      responderConsulta(REQUEST, provider, { timeoutMs: 5000 }),
    ).rejects.toThrow();
  });
});

describe("ruta /api/v1/vision/consulta", () => {
  it("responde 200 con el proveedor demo", async () => {
    const res = await consultaRoute.POST(req(REQUEST));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.ofertas).toEqual([]);
    expect(typeof body.data.respuesta).toBe("string");
    expect(body.data.modo).toBe("demo");
  });

  it("rechaza una pregunta demasiado corta y contexto inválido", async () => {
    expect((await consultaRoute.POST(req({ pregunta: "ab" }))).status).toBe(400);
    expect((await consultaRoute.POST(req({}))).status).toBe(400);
  });

  it("provider error → 502", async () => {
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      responderConsultaImagen: vi.fn(async () => {
        throw new AiProviderError("boom");
      }),
    });
    expect((await consultaRoute.POST(req(REQUEST))).status).toBe(502);
  });

  it("timeout → 504", async () => {
    mocks.timeoutMs = 10;
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      responderConsultaImagen: (_p: string, _c: unknown, signal: AbortSignal) =>
        new Promise((_r, reject) => {
          signal.addEventListener("abort", () => reject(new Error("abort")));
        }),
    });
    expect((await consultaRoute.POST(req(REQUEST))).status).toBe(504);
  });

  it("falla cerrado si el store está degradado", async () => {
    const spy = vi.spyOn(visionRateLimiter, "check").mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterMs: 0,
      degraded: true,
    });
    expect((await consultaRoute.POST(req(REQUEST))).status).toBe(503);
    spy.mockRestore();
  });
});
