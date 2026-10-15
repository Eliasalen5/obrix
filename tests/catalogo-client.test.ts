import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { catalogoApi } from "@/lib/api/catalogoClient";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente API catálogo (fetch)", () => {
  it("GET lista devuelve data en ok", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ data: [{ id: "c1", nombre: "Arena", orden: 0 }] }),
        { status: 200 },
      ),
    );

    const res = await catalogoApi.listCategorias();

    expect(res).toEqual({
      ok: true,
      data: [{ id: "c1", nombre: "Arena", orden: 0 }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/catalogo/categorias",
      expect.anything(),
    );
  });

  it("propaga error y details en respuesta no-ok", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Datos inválidos",
          details: [{ path: "nombre", message: "Nombre requerido" }],
        }),
        { status: 400 },
      ),
    );

    const res = await catalogoApi.createCategoria({ nombre: "x", orden: 0 });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(400);
      expect(res.error).toBe("Datos inválidos");
      expect(res.details?.[0].path).toBe("nombre");
    }
  });

  it("DELETE 204 devuelve ok sin data", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const res = await catalogoApi.deleteProducto("p1");

    expect(res).toEqual({ ok: true, data: undefined });
  });

  it("error de red devuelve status 0", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const res = await catalogoApi.listProductos();

    expect(res).toEqual({
      ok: false,
      status: 0,
      error: "No se pudo conectar con el servidor",
    });
  });

  it("POST envía JSON con content-type", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "p1" } }), { status: 201 }),
    );

    await catalogoApi.createProducto({
      sku: "CEM-001",
      nombre: "Cemento",
      unidad: "bolsa 50 kg",
      descripcion: "",
      categoriaId: "c1",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/catalogo/productos");
    expect(init.method).toBe("POST");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      sku: "CEM-001",
      nombre: "Cemento",
      unidad: "bolsa 50 kg",
      descripcion: "",
      categoriaId: "c1",
    });
  });
});
