import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { solicitudComercioApi, solicitudAdminApi } from "@/lib/api/solicitudClient";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const PROPUESTA = {
  nombre: "Tornillo 8x2",
  categoriaId: "c1",
  unidad: "caja 100 u",
  marca: "",
  fabricante: "",
  codigoBarras: "",
  codigoFabricante: "",
  descripcion: "",
  imagenUrl: "",
  atributos: {},
  precio: 4500,
  stock: 2,
};

function ok(data: unknown) {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ data }), { status: 200 }),
  );
}

describe("cliente API solicitudes — comercio", () => {
  it("listSolicitudes sin estado → GET sin querystring", async () => {
    ok([]);
    await solicitudComercioApi.listSolicitudes();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/comercio/solicitudes");
  });

  it("listSolicitudes con estado → añade querystring", async () => {
    ok([]);
    await solicitudComercioApi.listSolicitudes("PENDIENTE_REVISION");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/v1/comercio/solicitudes?estado=PENDIENTE_REVISION",
    );
  });

  it("crearSolicitud hace POST con { propuesta }", async () => {
    ok({ solicitud: { id: "s1" }, posiblesDuplicados: [] });

    const res = await solicitudComercioApi.crearSolicitud(PROPUESTA);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/comercio/solicitudes");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ propuesta: PROPUESTA });
    expect(res.ok).toBe(true);
  });

  it("propaga 409 con coincidencias", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Producto duplicado",
          details: { coincidencias: [{ id: "p1" }] },
        }),
        { status: 409, headers: { "content-type": "application/json" } },
      ),
    );

    const res = await solicitudComercioApi.crearSolicitud(PROPUESTA);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(409);
    }
  });
});

describe("cliente API solicitudes — admin", () => {
  it("listSolicitudes con estado → GET con querystring", async () => {
    ok([]);
    await solicitudAdminApi.listSolicitudes("PENDIENTE_REVISION");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/v1/admin/solicitudes?estado=PENDIENTE_REVISION",
    );
  });

  it("aprobar hace POST a /aprobar con el input", async () => {
    ok({ id: "s1", estado: "APROBADA" });

    await solicitudAdminApi.aprobar("s1", { modo: "nuevo" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/admin/solicitudes/s1/aprobar");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ modo: "nuevo" });
  });

  it("aprobar vincular envía productoId", async () => {
    ok({ id: "s1", estado: "VINCULADA" });
    await solicitudAdminApi.aprobar("s1", { modo: "vincular", productoId: "p9" });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      modo: "vincular",
      productoId: "p9",
    });
  });

  it("rechazar hace POST a /rechazar con el motivo", async () => {
    ok({ id: "s1", estado: "RECHAZADA" });

    await solicitudAdminApi.rechazar("s1", "Duplicado");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/admin/solicitudes/s1/rechazar");
    expect(JSON.parse(init.body)).toEqual({ motivo: "Duplicado" });
  });

  it("error de red devuelve status 0", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const res = await solicitudAdminApi.listSolicitudes();
    expect(res).toEqual({
      ok: false,
      status: 0,
      error: "No se pudo conectar con el servidor",
    });
  });
});
