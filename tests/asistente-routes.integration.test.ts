import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { ROLES, type Role } from "@/lib/auth/constants";
import { asistenteRateLimiter, resolveLimitPerMin } from "@/lib/rate-limit";
import { AiProviderError } from "@/lib/ai/errors";
import * as asistente from "@/app/api/asistente/route";

const mocks = vi.hoisted(() => ({
  getAiProvider: vi.fn(),
  timeoutMs: 2000,
}));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

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

const sessionMock = getServerSession as unknown as Mock;

const RESULTADO = {
  titulo: "Parrilla de obra (simulado): quiero hacer una parrilla",
  materiales: [
    { nombre: "Ladrillo común", cantidad: 120, unidad: "unidad" },
  ],
  supuestos: ["Modo demo"],
  aclaraciones: ["Estimación orientativa"],
};

function proveedorDemo() {
  return {
    nombre: "demo",
    esDemo: true,
    generarProyecto: vi.fn(async () => RESULTADO),
  };
}

function conSesionRol(role: Role) {
  sessionMock.mockResolvedValue({
    user: { id: "u1", role },
    expires: "",
  });
}

function sinSesion() {
  sessionMock.mockResolvedValue(null);
}

function req(body: unknown) {
  return new Request("http://localhost/api/asistente", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.timeoutMs = 2000;
  mocks.getAiProvider.mockReturnValue(proveedorDemo());
  asistenteRateLimiter.reset();
});

describe("asistente — autorización", () => {
  it("sin sesión → 401", async () => {
    sinSesion();
    const res = await asistente.POST(req({ descripcion: "parrilla de 1,5 m" }));
    expect(res.status).toBe(401);
  });

  it("ADMIN → 403", async () => {
    conSesionRol(ROLES.ADMIN);
    const res = await asistente.POST(req({ descripcion: "parrilla de 1,5 m" }));
    expect(res.status).toBe(403);
  });

  it("COMERCIO → 403", async () => {
    conSesionRol(ROLES.COMERCIO);
    const res = await asistente.POST(req({ descripcion: "parrilla de 1,5 m" }));
    expect(res.status).toBe(403);
  });
});

describe("asistente — validación", () => {
  it("entrada inválida → 400", async () => {
    conSesionRol(ROLES.CLIENTE);
    const res = await asistente.POST(req({ descripcion: "x" }));
    expect(res.status).toBe(400);
  });

  it("JSON inválido → 400", async () => {
    conSesionRol(ROLES.CLIENTE);
    const res = await asistente.POST(req("{no-json"));
    expect(res.status).toBe(400);
  });

  it("éxito → 200 con data", async () => {
    conSesionRol(ROLES.CLIENTE);
    const res = await asistente.POST(req({ descripcion: "quiero hacer una parrilla de 1,5 m" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.esEstimacion).toBe(true);
    expect(body.data.modo).toBe("demo");
  });
});

describe("asistente — errores del proveedor", () => {
  it("provider error → 502", async () => {
    conSesionRol(ROLES.CLIENTE);
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      generarProyecto: vi.fn(async () => {
        throw new AiProviderError("boom");
      }),
    });
    const res = await asistente.POST(req({ descripcion: "quiero hacer una parrilla de 1,5 m" }));
    expect(res.status).toBe(502);
  });

  it("timeout → 504", async () => {
    conSesionRol(ROLES.CLIENTE);
    mocks.timeoutMs = 10;
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      generarProyecto: (_d: string, signal: AbortSignal) =>
        new Promise((_r, reject) => {
          signal.addEventListener("abort", () => reject(new Error("abort")));
        }),
    });
    const res = await asistente.POST(req({ descripcion: "quiero hacer una parrilla de 1,5 m" }));
    expect(res.status).toBe(504);
  });

  it("respuesta inválida → 502", async () => {
    conSesionRol(ROLES.CLIENTE);
    mocks.getAiProvider.mockReturnValue({
      nombre: "x",
      esDemo: false,
      generarProyecto: vi.fn(async () => ({ titulo: "solo esto" })),
    });
    const res = await asistente.POST(req({ descripcion: "quiero hacer una parrilla de 1,5 m" }));
    expect(res.status).toBe(502);
  });
});

describe("asistente — rate limiting", () => {
  it("rechaza con 429 al superar el límite", async () => {
    conSesionRol(ROLES.CLIENTE);
    const limite = resolveLimitPerMin();
    const body = { descripcion: "quiero hacer una parrilla de 1,5 m" };

    for (let i = 0; i < limite; i++) {
      const ok = await asistente.POST(req(body));
      expect(ok.status).toBe(200);
    }

    const res = await asistente.POST(req(body));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).not.toBeNull();
  });

  it("cada usuario tiene su propio cupo", async () => {
    conSesionRol(ROLES.CLIENTE);
    const limite = resolveLimitPerMin();
    const body = { descripcion: "quiero hacer una parrilla de 1,5 m" };
    for (let i = 0; i < limite; i++) await asistente.POST(req(body));
    expect((await asistente.POST(req(body))).status).toBe(429);

    sessionMock.mockResolvedValue({ user: { id: "u2", role: ROLES.CLIENTE }, expires: "" });
    expect((await asistente.POST(req(body))).status).toBe(200);
  });
});
