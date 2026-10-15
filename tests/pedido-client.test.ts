import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pedidoApi, comercioPedidoApi } from "@/lib/api/pedidoClient";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente API pedidos (cliente) (fetch)", () => {
  it("listar hace GET /api/pedidos", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: "p1" }] }), { status: 200 }),
    );

    const res = await pedidoApi.listar();

    expect(res).toEqual({ ok: true, data: [{ id: "p1" }] });
    expect(fetchMock).toHaveBeenCalledWith("/api/pedidos", expect.anything());
  });

  it("crear hace POST con cotizacionId y comercioId", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "p1" } }), { status: 201 }),
    );

    await pedidoApi.crear({ cotizacionId: "cot1", comercioId: "com1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/pedidos");
    expect(init.method).toBe("POST");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      cotizacionId: "cot1",
      comercioId: "com1",
    });
  });

  it("obtener hace GET al recurso", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "p9" } }), { status: 200 }),
    );

    await pedidoApi.obtener("p9");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/pedidos/p9");
  });

  it("cancelar hace PATCH con estado CANCELADO", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { id: "p1", estado: "CANCELADO" } }),
        { status: 200 },
      ),
    );

    await pedidoApi.cancelar("p1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/pedidos/p1");
    expect(init.method).toBe("PATCH");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ estado: "CANCELADO" });
  });

  it("propaga error y status en respuesta no-ok", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 }),
    );

    const res = await pedidoApi.listar();

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(401);
      expect(res.error).toBe("No autorizado");
    }
  });

  it("error de red devuelve status 0", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const res = await pedidoApi.listar();

    expect(res).toEqual({
      ok: false,
      status: 0,
      error: "No se pudo conectar con el servidor",
    });
  });
});

describe("cliente API pedidos (comercio) (fetch)", () => {
  it("listar hace GET /api/comercio/pedidos", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    const res = await comercioPedidoApi.listar();

    expect(res).toEqual({ ok: true, data: [] });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/comercio/pedidos",
      expect.anything(),
    );
  });

  it("obtener hace GET al recurso del comercio", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "p9" } }), { status: 200 }),
    );

    await comercioPedidoApi.obtener("p9");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/comercio/pedidos/p9");
  });

  it("cambiarEstado hace PATCH con el estado", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { id: "p1", estado: "CONFIRMADO" } }),
        { status: 200 },
      ),
    );

    await comercioPedidoApi.cambiarEstado("p1", "CONFIRMADO");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/comercio/pedidos/p1");
    expect(init.method).toBe("PATCH");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ estado: "CONFIRMADO" });
  });
});
