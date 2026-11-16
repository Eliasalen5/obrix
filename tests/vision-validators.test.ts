import { describe, expect, it } from "vitest";
import {
  DETALLE_MAX,
  IMAGEN_MAX_BYTES,
  imagenVisionSchema,
  tieneFirmaImagenValida,
} from "@/lib/validators/vision";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const DETALLE = "Sujetar chapa en el techo del galpón";

describe("imagenVisionSchema", () => {
  it("acepta PNG, JPEG y WebP dentro del límite", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      const imagen = new File([PNG], "material", { type });
      expect(
        imagenVisionSchema.safeParse({ imagen, detalle: DETALLE }).success,
      ).toBe(true);
    }
  });

  it("rechaza una imagen ausente o vacía", () => {
    expect(
      imagenVisionSchema.safeParse({ imagen: null, detalle: DETALLE }).success,
    ).toBe(false);
    expect(
      imagenVisionSchema.safeParse({
        imagen: new File([], "vacia.png", { type: "image/png" }),
        detalle: DETALLE,
      }).success,
    ).toBe(false);
  });

  it("rechaza tipos no permitidos y archivos mayores a 4 MB", () => {
    expect(
      imagenVisionSchema.safeParse({
        imagen: new File(["texto"], "texto.txt", { type: "text/plain" }),
        detalle: DETALLE,
      }).success,
    ).toBe(false);
    expect(
      imagenVisionSchema.safeParse({
        imagen: new File([new Uint8Array(IMAGEN_MAX_BYTES + 1)], "grande.png", {
          type: "image/png",
        }),
        detalle: DETALLE,
      }).success,
    ).toBe(false);
  });

  it("exige el detalle de la tarea", () => {
    const imagen = new File([PNG], "material.png", { type: "image/png" });
    expect(imagenVisionSchema.safeParse({ imagen }).success).toBe(false);
    expect(
      imagenVisionSchema.safeParse({ imagen, detalle: "corto" }).success,
    ).toBe(false);
    expect(
      imagenVisionSchema.safeParse({
        imagen,
        detalle: "x".repeat(DETALLE_MAX + 1),
      }).success,
    ).toBe(false);
  });
});

describe("firma de la imagen", () => {
  it("reconoce las firmas esperadas y rechaza contenido disfrazado", () => {
    expect(tieneFirmaImagenValida(PNG, "image/png")).toBe(true);
    expect(
      tieneFirmaImagenValida(
        new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
        "image/jpeg",
      ),
    ).toBe(true);
    expect(
      tieneFirmaImagenValida(
        new TextEncoder().encode("RIFFxxxxWEBP"),
        "image/webp",
      ),
    ).toBe(true);
    expect(tieneFirmaImagenValida(new Uint8Array([1, 2, 3]), "image/png")).toBe(
      false,
    );
    expect(tieneFirmaImagenValida(PNG, "image/jpeg")).toBe(false);
  });
});
