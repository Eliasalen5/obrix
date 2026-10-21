import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { asistenteApi } from "@/lib/api/asistenteClient";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const RESPUESTA = {
  titulo: "Parrilla",
  materiales: [{ nombre: "Ladrillo", cantidad: 100, unidad: "u" }],
  supuestos: [],
  aclaraciones: [],
  esEstimacion: true,
  modo: "demo",
  aviso: "Estimación de demo",
};

describe("cliente API asistente (fetch)", () => {
  it("estimar hace POST con descripcion y devuelve data", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: RESPUESTA }), { status: 200 }),
    );

    const res = await asistenteApi.estimar("Quiero hacer una parrilla");

    expect(res).toEqual({ ok: true, data: RESPUESTA });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/asistente");
    expect(init.method).toBe("POST");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      descripcion: "Quiero hacer una parrilla",
    });
  });

  it("propaga error y details en respuesta no-ok", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Datos inválidos",
          details: [{ path: "descripcion", message: "Muy corta" }],
        }),
        { status: 400 },
      ),
    );

    const res = await asistenteApi.estimar("x");

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(400);
      expect(res.error).toBe("Datos inválidos");
      expect(res.details?.[0].path).toBe("descripcion");
    }
  });

  it("error de red devuelve status 0", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const res = await asistenteApi.estimar("Quiero hacer una parrilla");

    expect(res).toEqual({
      ok: false,
      status: 0,
      error: "No se pudo conectar con el servidor",
    });
  });
});
