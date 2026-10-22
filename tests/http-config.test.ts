import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { request, configureHttp, resetHttp } from "@/lib/api/httpClient";
import { authApi } from "@/lib/api/authClient";

function okJson(data: unknown) {
  return { ok: true, status: 200, json: async () => ({ data }) };
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  resetHttp();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetHttp();
});

describe("request — transporte configurable (base URL + headers)", () => {
  it("por defecto usa la URL tal cual (web, mismo origen)", async () => {
    fetchMock.mockResolvedValue(okJson({ hola: 1 }));

    await request("/api/v1/asistente");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/asistente");
  });

  it("con baseUrl prefija rutas relativas (mobile)", async () => {
    configureHttp({ baseUrl: "https://obrix.app" });
    fetchMock.mockResolvedValue(okJson({ hola: 1 }));

    await request("/api/v1/pedidos");

    expect(fetchMock.mock.calls[0][0]).toBe("https://obrix.app/api/v1/pedidos");
  });

  it("no prefija URLs absolutas aunque haya baseUrl", async () => {
    configureHttp({ baseUrl: "https://obrix.app" });
    fetchMock.mockResolvedValue(okJson({}));

    await request("https://otro.com/api");

    expect(fetchMock.mock.calls[0][0]).toBe("https://otro.com/api");
  });

  it("adjunta headers por defecto (Bearer) en cada request", async () => {
    configureHttp({
      baseUrl: "https://obrix.app",
      headers: { authorization: "Bearer jwt.token" },
    });
    fetchMock.mockResolvedValue(okJson({}));

    await request("/api/v1/asistente");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe(
      "Bearer jwt.token",
    );
  });

  it("agrega content-type cuando hay body y conserva el Bearer", async () => {
    configureHttp({ headers: { authorization: "Bearer t" } });
    fetchMock.mockResolvedValue(okJson({}));

    await request("/api/v1/cotizaciones", { method: "POST", body: "{}" });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["content-type"]).toBe("application/json");
    expect(headers.authorization).toBe("Bearer t");
  });
});

describe("authApi.login — emisión de token mobile", () => {
  it("POST a /api/v1/auth/token con email y password", async () => {
    fetchMock.mockResolvedValue(
      okJson({ token: "jwt.abc", expiresIn: 100, user: { id: "u1" } }),
    );

    const res = await authApi.login("ana@test.com", "secreta123");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/token");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email: "ana@test.com",
      password: "secreta123",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.token).toBe("jwt.abc");
  });
});
