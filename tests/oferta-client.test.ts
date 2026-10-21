import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ofertaApi } from "@/lib/api/ofertaClient";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const INPUT = {
  productoId: "prod1",
  precio: 100,
  stock: 5,
  marca: "Demo",
  presentacion: "bolsa 50 kg",
  activo: true,
};

describe("cliente API ofertas (fetch)", () => {
  it("listCatalogo hace GET /api/comercio/catalogo", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: "prod1" }] }), { status: 200 }),
    );

    const res = await ofertaApi.listCatalogo();

    expect(res).toEqual({ ok: true, data: [{ id: "prod1" }] });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/comercio/catalogo",
      expect.anything(),
    );
  });

  it("listOfertas hace GET /api/comercio/ofertas", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    await ofertaApi.listOfertas();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/comercio/ofertas");
  });

  it("upsertOferta hace POST con el body", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "of1" } }), { status: 200 }),
    );

    await ofertaApi.upsertOferta(INPUT);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/comercio/ofertas");
    expect(init.method).toBe("POST");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual(INPUT);
  });

  it("updateOferta hace PATCH al recurso", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "of1" } }), { status: 200 }),
    );

    await ofertaApi.updateOferta("of1", { precio: 120 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/comercio/ofertas/of1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ precio: 120 });
  });

  it("deleteOferta DELETE 204 devuelve ok sin data", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const res = await ofertaApi.deleteOferta("of1");

    expect(res).toEqual({ ok: true, data: undefined });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/comercio/ofertas/of1");
    expect(init.method).toBe("DELETE");
  });

  it("error de red devuelve status 0", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const res = await ofertaApi.listOfertas();

    expect(res).toEqual({
      ok: false,
      status: 0,
      error: "No se pudo conectar con el servidor",
    });
  });
});
