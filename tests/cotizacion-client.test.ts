import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cotizacionApi } from "@/lib/api/cotizacionClient";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const INPUT = {
  prompt: "Parrilla",
  materiales: [{ nombre: "Ladrillo", cantidad: 100, unidad: "u" }],
};

describe("cliente API cotizaciones (fetch)", () => {
  it("crear hace POST con el body y devuelve data", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { cotizacion: { id: "cot1" }, comparacion: {} } }),
        { status: 201 },
      ),
    );

    const res = await cotizacionApi.crear(INPUT);

    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.cotizacion.id).toBe("cot1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/cotizaciones");
    expect(init.method).toBe("POST");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual(INPUT);
  });

  it("listar hace GET y devuelve data", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: "cot1" }] }), { status: 200 }),
    );

    const res = await cotizacionApi.listar();

    expect(res).toEqual({ ok: true, data: [{ id: "cot1" }] });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/cotizaciones",
      expect.anything(),
    );
  });

  it("obtener hace GET al recurso", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { cotizacion: { id: "cot9" }, comparacion: {} } }),
        { status: 200 },
      ),
    );

    await cotizacionApi.obtener("cot9");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/cotizaciones/cot9");
  });

  it("propaga error y details en respuesta no-ok", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Datos inválidos",
          details: [{ path: "materiales", message: "Requerido" }],
        }),
        { status: 400 },
      ),
    );

    const res = await cotizacionApi.crear(INPUT);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(400);
      expect(res.error).toBe("Datos inválidos");
      expect(res.details?.[0].path).toBe("materiales");
    }
  });

  it("error de red devuelve status 0", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const res = await cotizacionApi.listar();

    expect(res).toEqual({
      ok: false,
      status: 0,
      error: "No se pudo conectar con el servidor",
    });
  });
});
