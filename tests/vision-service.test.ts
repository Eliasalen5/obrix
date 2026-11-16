import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemoProvider } from "@/lib/ai/demoProvider";
import { AiInvalidResponseError, AiTimeoutError } from "@/lib/ai/errors";
import { OpenAiProvider, type FetchLike } from "@/lib/ai/openaiProvider";
import { identificarYBuscar } from "@/lib/services/vision.service";

const mocks = vi.hoisted(() => ({ buscarOfertasPublicas: vi.fn() }));
vi.mock("@/lib/ofertas/buscarOfertas", () => ({
  buscarOfertasPublicas: mocks.buscarOfertasPublicas,
}));

const OFERTA = {
  id: "o1",
  precio: 8500,
  marca: "Genérica",
  presentacion: "Caja x100",
  producto: {
    nombre: "Tornillos autoperforantes",
    unidad: "caja x100",
    marca: "Genérica",
    categoria: { nombre: "Ferreterías" },
  },
  comercio: { nombre: "Ferretería Demo", direccion: "Av. Siempre Viva 742" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.buscarOfertasPublicas.mockResolvedValue([OFERTA]);
});

describe("demoProvider.identificarImagen", () => {
  it("devuelve una identificación probable con incertidumbres", async () => {
    const res = await identificarYBuscar(
      "base64",
      "image/png",
      new DemoProvider(),
      { timeoutMs: 5000 },
    );

    expect(res.modo).toBe("demo");
    expect(res.identificacion.confianza).toBe("probable");
    expect(res.identificacion.incertidumbres.length).toBeGreaterThan(0);
    expect(mocks.buscarOfertasPublicas).toHaveBeenCalledWith({
      q: "tornillo",
      categoria: "Ferreterías",
      take: 12,
    });
    expect(res.ofertas[0]).toMatchObject({
      id: "o1",
      productoNombre: "Tornillos autoperforantes",
      precio: 8500,
    });
  });

  it("usa el detalle de la tarea para orientar los términos", async () => {
    const res = await identificarYBuscar(
      "base64",
      "image/png",
      new DemoProvider(),
      { timeoutMs: 5000, detalle: "Necesito pintar una terraza" },
    );

    expect(mocks.buscarOfertasPublicas).toHaveBeenCalledWith({
      q: "impermeabilizante membrana",
      categoria: "Pinturerías",
      take: 12,
    });
    expect(res.detalle).toBe("Necesito pintar una terraza");
  });

  it("reenvía el detalle al proveedor", async () => {
    const identificarImagen = vi.fn(async () => ({
      objeto: "Tornillo",
      tipo: "Autoperforante",
      caracteristicas: [],
      incertidumbres: ["Medidas"],
      confianza: "probable",
      terminos: "tornillo",
      categoria: "Ferreterías",
    }));
    const provider: any = { nombre: "test", esDemo: false, identificarImagen };

    await identificarYBuscar("base64", "image/png", provider, {
      timeoutMs: 5000,
      detalle: "Sujetar chapa en el techo",
    });

    expect(identificarImagen).toHaveBeenCalledWith(
      "base64",
      "image/png",
      expect.any(AbortSignal),
      { detalle: "Sujetar chapa en el techo" },
    );
  });
});

describe("vision.service", () => {
  it("ignora una categoría fuera de la taxonomía", async () => {
    const provider: any = {
      nombre: "test",
      esDemo: false,
      identificarImagen: async () => ({
        objeto: "Pieza",
        tipo: "Desconocido",
        caracteristicas: [],
        incertidumbres: ["Medidas"],
        confianza: "probable",
        terminos: "pieza",
        categoria: "Categoría inventada",
      }),
    };
    const res = await identificarYBuscar("base64", "image/png", provider, {
      timeoutMs: 5000,
    });
    expect(res.identificacion.categoria).toBeUndefined();
    expect(mocks.buscarOfertasPublicas).toHaveBeenCalledWith({
      q: "pieza",
      categoria: undefined,
      take: 12,
    });
  });

  it("lanza timeout si el proveedor demora", async () => {
    const provider: any = {
      nombre: "test",
      esDemo: false,
      identificarImagen: async (_b: string, _m: string, signal: AbortSignal) =>
        new Promise((_, reject) => {
          signal.addEventListener("abort", () => reject(new Error("abort")));
        }),
    };
    await expect(
      identificarYBuscar("base64", "image/png", provider, { timeoutMs: 10 }),
    ).rejects.toThrow(AiTimeoutError);
  });

  it("rechaza una salida incompleta", async () => {
    const provider: any = {
      nombre: "test",
      esDemo: false,
      identificarImagen: async () => ({ objeto: "Tornillo" }),
    };
    await expect(
      identificarYBuscar("base64", "image/png", provider, { timeoutMs: 5000 }),
    ).rejects.toThrow(AiInvalidResponseError);
  });
});

describe("openaiProvider.identificarImagen", () => {
  it("envía la imagen como data URL y procesa el JSON", async () => {
    const salida = {
      objeto: "Tornillo",
      tipo: "Autoperforante",
      caracteristicas: ["Cabeza hexagonal"],
      incertidumbres: ["Medidas"],
      confianza: "probable",
      terminos: "tornillo",
      categoria: "Ferreterías",
    };
    const mockFetch: FetchLike = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(salida) } }],
      }),
    })) as any;
    const provider = new OpenAiProvider(
      { demo: false, model: "m", baseUrl: "http://x/v1", timeoutMs: 5000 },
      mockFetch,
    );
    const res = await provider.identificarImagen(
      "YWJj",
      "image/png",
      new AbortController().signal,
    );

    expect(res).toEqual(salida);
    const init = (mockFetch as any).mock.calls[0][1];
    const body = JSON.parse(init.body);
    expect(body.messages[1].content[1].image_url.url).toBe(
      "data:image/png;base64,YWJj",
    );
  });
});
