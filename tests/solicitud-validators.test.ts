import { describe, it, expect } from "vitest";
import {
  aprobarSolicitudSchema,
  crearSolicitudSchema,
  propuestaProductoSchema,
  rechazarSolicitudSchema,
  ESTADOS_SOLICITUD_LISTA,
} from "@/lib/validators/solicitud";

const propuestaValida = {
  nombre: "Cemento Portland 50 kg",
  categoriaId: "c1",
  unidad: "bolsa 50 kg",
  marca: "Loma Negra",
  fabricante: "Loma Negra",
  codigoBarras: "7791234567890",
  codigoFabricante: "LN-50",
  descripcion: "Cemento de uso general",
  imagenUrl: "",
  atributos: { peso: "50 kg" },
  precio: 12000,
  stock: 10,
};

describe("propuestaProductoSchema", () => {
  it("acepta una propuesta válida y aplica defaults", () => {
    const parsed = propuestaProductoSchema.parse({
      nombre: "Clavo 2 pulgadas",
      categoriaId: "c1",
      unidad: "kg",
      precio: 500,
    });
    expect(parsed.marca).toBe("");
    expect(parsed.codigoBarras).toBe("");
    expect(parsed.atributos).toEqual({});
    expect(parsed.stock).toBe(0);
  });

  it("rechaza nombre muy corto", () => {
    const res = propuestaProductoSchema.safeParse({
      ...propuestaValida,
      nombre: "C",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza precio no positivo", () => {
    const res = propuestaProductoSchema.safeParse({
      ...propuestaValida,
      precio: 0,
    });
    expect(res.success).toBe(false);
  });

  it("rechaza categoría vacía", () => {
    const res = propuestaProductoSchema.safeParse({
      ...propuestaValida,
      categoriaId: "",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza código de barras con caracteres inválidos", () => {
    const res = propuestaProductoSchema.safeParse({
      ...propuestaValida,
      codigoBarras: "abc$%",
    });
    expect(res.success).toBe(false);
  });
});

describe("crearSolicitudSchema", () => {
  it("requiere la propuesta", () => {
    const res = crearSolicitudSchema.safeParse({});
    expect(res.success).toBe(false);
  });

  it("acepta { propuesta }", () => {
    const res = crearSolicitudSchema.safeParse({ propuesta: propuestaValida });
    expect(res.success).toBe(true);
  });
});

describe("aprobarSolicitudSchema", () => {
  it("acepta modo nuevo", () => {
    expect(aprobarSolicitudSchema.safeParse({ modo: "nuevo" }).success).toBe(true);
  });

  it("acepta modo vincular con productoId", () => {
    expect(
      aprobarSolicitudSchema.safeParse({ modo: "vincular", productoId: "p1" })
        .success,
    ).toBe(true);
  });

  it("rechaza vincular sin productoId", () => {
    expect(
      aprobarSolicitudSchema.safeParse({ modo: "vincular" }).success,
    ).toBe(false);
  });

  it("rechaza modo desconocido", () => {
    expect(aprobarSolicitudSchema.safeParse({ modo: "borrar" }).success).toBe(
      false,
    );
  });
});

describe("rechazarSolicitudSchema", () => {
  it("exige un motivo", () => {
    expect(rechazarSolicitudSchema.safeParse({ motivo: "" }).success).toBe(false);
  });

  it("acepta un motivo válido", () => {
    const res = rechazarSolicitudSchema.parse({ motivo: "Duplicado del catálogo" });
    expect(res.motivo).toBe("Duplicado del catálogo");
  });
});

describe("estados de solicitud", () => {
  it("incluye los cuatro estados del flujo", () => {
    expect(ESTADOS_SOLICITUD_LISTA).toEqual([
      "PENDIENTE_REVISION",
      "APROBADA",
      "VINCULADA",
      "RECHAZADA",
    ]);
  });
});
