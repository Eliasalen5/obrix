import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    producto: mocks,
  },
}));

import { productoService } from "@/lib/services/catalogo.service";

const EXISTENTE = {
  id: "p1",
  sku: "OBR-001",
  nombre: "Cemento",
  unidad: "bolsa 50 kg",
  descripcion: "",
  marca: "Loma Negra",
  fabricante: "Loma",
  codigoFabricante: "LN-1",
  codigoBarras: "779123",
};

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.findMany.mockResolvedValue([]);
  mocks.count.mockResolvedValue(0);
});

describe("productoService.search", () => {
  it("filtra por tokens normalizados y pagina en la base", async () => {
    const res = await productoService.search({
      q: "Cemento 50kg",
      categoriaId: "c1",
      limit: 25,
      offset: 50,
    });

    expect(res).toEqual({ productos: [], total: 0 });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        categoriaId: "c1",
        AND: [
          { busqueda: { contains: "cemento" } },
          { busqueda: { contains: "50" } },
          { busqueda: { contains: "kg" } },
        ],
      },
      include: { categoria: true, subcategoria: true },
      orderBy: { nombre: "asc" },
      skip: 50,
      take: 25,
    });
    expect(mocks.count).toHaveBeenCalledWith({
      where: {
        categoriaId: "c1",
        AND: [
          { busqueda: { contains: "cemento" } },
          { busqueda: { contains: "50" } },
          { busqueda: { contains: "kg" } },
        ],
      },
    });
  });

  it("sin filtros no agrega condiciones de búsqueda", async () => {
    await productoService.search({ limit: 50, offset: 0 });

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("filtra por subcategoría además de la categoría", async () => {
    await productoService.search({
      categoriaId: "c1",
      subcategoriaId: "s1",
      limit: 50,
      offset: 0,
    });

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoriaId: "c1", subcategoriaId: "s1" },
      }),
    );
  });
});

describe("productoService.create/update", () => {
  it("calcula busqueda al crear", async () => {
    mocks.create.mockResolvedValue({ id: "p2" });

    await productoService.create({
      sku: "OBR-002",
      nombre: "Cemento Portland",
      unidad: "bolsa 50 kg",
      descripcion: "",
      categoriaId: "c1",
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        busqueda: "cemento portland obr 002 bolsa 50 kg",
      }),
      include: { categoria: true, subcategoria: true },
    });
  });

  it("recalcula busqueda al actualizar conservando campos no enviados", async () => {
    mocks.findUnique.mockResolvedValue(EXISTENTE);
    mocks.update.mockResolvedValue({ id: "p1" });

    await productoService.update("p1", { nombre: "Cemento gris" });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({
        nombre: "Cemento gris",
        busqueda: expect.stringContaining("cemento gris"),
      }),
      include: { categoria: true, subcategoria: true },
    });
    const data = mocks.update.mock.calls[0][0].data;
    expect(data.busqueda).toContain("loma negra");
    expect(data.busqueda).toContain("779123");
  });
});
