import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  consumirProyectoPendiente,
  guardarProyectoPendiente,
  PROYECTO_PENDIENTE_KEY,
} from "@/lib/proyecto/pendiente";

const store = new Map<string, string>();
const sessionStorageMock = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    store.delete(key);
  }),
};

beforeEach(() => {
  store.clear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  vi.stubGlobal("window", { sessionStorage: sessionStorageMock });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pendiente de proyecto en sessionStorage", () => {
  it("guarda el texto normalizado y autoEstimar por defecto", () => {
    guardarProyectoPendiente("  Quiero hacer una parrilla de 1,5 m  ");

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      PROYECTO_PENDIENTE_KEY,
      JSON.stringify({
        descripcion: "Quiero hacer una parrilla de 1,5 m",
        autoEstimar: true,
      }),
    );
  });

  it("consume el pendiente una sola vez", () => {
    guardarProyectoPendiente("Quiero hacer una parrilla de 1,5 m", false);

    expect(consumirProyectoPendiente()).toEqual({
      descripcion: "Quiero hacer una parrilla de 1,5 m",
      autoEstimar: false,
    });
    expect(consumirProyectoPendiente()).toBeNull();
  });

  it("ignora textos demasiado cortos o largos", () => {
    guardarProyectoPendiente("corto");

    expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    expect(consumirProyectoPendiente()).toBeNull();
  });

  it("descarta pendientes con formato inválido", () => {
    store.set(PROYECTO_PENDIENTE_KEY, JSON.stringify({ descripcion: 123 }));

    expect(consumirProyectoPendiente()).toBeNull();
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
      PROYECTO_PENDIENTE_KEY,
    );
  });

  it("no falla fuera del navegador", () => {
    vi.unstubAllGlobals();

    expect(() => guardarProyectoPendiente("Quiero hacer una parrilla")).not.toThrow();
    expect(consumirProyectoPendiente()).toBeNull();
  });
});
