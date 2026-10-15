import { prisma } from "@/lib/prisma";
import {
  comparacionSchema,
  ESTADOS_COTIZACION,
  RANKING_POR,
  type Alternativa,
  type Comparacion,
  type Cotizacion,
  type CotizacionResponse,
  type CrearCotizacionInput,
  type MatchInfo,
  type MaterialCotizado,
} from "@/lib/validators/cotizacion";
import {
  compararOfertas,
  matchMateriales,
  type MaterialCotizable,
  type MatchResult,
} from "./cotizador.service";

const ESTADOS_VALIDOS = new Set<string>(ESTADOS_COTIZACION);

type SnapshotMatch = {
  materialId: string;
  match: MatchInfo | null;
  alternativas: Alternativa[];
};

type ResultadoSnapshot = {
  version: 1;
  comparacion: Comparacion;
  matches: SnapshotMatch[];
};

type FilaCotizacion = {
  id: string;
  prompt: string;
  estado: string;
  createdAt: Date;
  resultadoJson: string | null;
  materiales: {
    id: string;
    nombre: string;
    cantidad: number;
    unidad: string;
    productoId: string | null;
  }[];
};

function normalizarEstado(estado: string): Cotizacion["estado"] {
  return (ESTADOS_VALIDOS.has(estado)
    ? estado
    : "COMPARADA") as Cotizacion["estado"];
}

function leerSnapshot(raw: string | null): ResultadoSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ResultadoSnapshot>;
    const comparacion = comparacionSchema.safeParse(parsed.comparacion);
    if (!comparacion.success) return null;
    const matches = Array.isArray(parsed.matches) ? parsed.matches : [];
    return { version: 1, comparacion: comparacion.data, matches };
  } catch {
    return null;
  }
}

function aMaterialCotizado(
  fila: FilaCotizacion["materiales"][number],
  resultado: MatchResult | undefined,
): MaterialCotizado {
  return {
    id: fila.id,
    nombre: fila.nombre,
    cantidad: fila.cantidad,
    unidad: fila.unidad,
    productoId: fila.productoId,
    match: resultado?.match ?? null,
    alternativas: resultado?.alternativas ?? [],
  };
}

function aMaterialDesdeSnapshot(
  fila: FilaCotizacion["materiales"][number],
  snapshot: ResultadoSnapshot | null,
): MaterialCotizado {
  const guardado = snapshot?.matches.find((m) => m.materialId === fila.id);
  return {
    id: fila.id,
    nombre: fila.nombre,
    cantidad: fila.cantidad,
    unidad: fila.unidad,
    productoId: fila.productoId,
    match: guardado?.match ?? null,
    alternativas: guardado?.alternativas ?? [],
  };
}

function aCotizacion(
  fila: FilaCotizacion,
  materiales: MaterialCotizado[],
): Cotizacion {
  return {
    id: fila.id,
    prompt: fila.prompt,
    estado: normalizarEstado(fila.estado),
    createdAt: fila.createdAt.toISOString(),
    materiales,
  };
}

function comparacionVacia(itemsTotales: number): Comparacion {
  return {
    itemsTotales,
    rankingPor: RANKING_POR,
    comercios: [],
    items: [],
    sinMatch: [],
    advertencias: ["La cotización se guardó sin resultado de comparación."],
  };
}

export const cotizacionService = {
  async crear(
    clienteId: string,
    input: CrearCotizacionInput,
  ): Promise<CotizacionResponse> {
    const productos = await prisma.producto.findMany({
      select: { id: true, sku: true, nombre: true, unidad: true },
    });

    const resultados = matchMateriales(
      input.materiales.map((material) => ({
        nombre: material.nombre,
        unidad: material.unidad,
        productoId: material.productoId,
      })),
      productos,
    );

    const creada = await prisma.cotizacion.create({
      data: {
        prompt: input.prompt ?? "",
        estado: "COMPARADA",
        clienteId,
        materiales: {
          create: input.materiales.map((material, indice) => ({
            nombre: material.nombre,
            cantidad: material.cantidad,
            unidad: material.unidad,
            productoId: resultados[indice]?.productoId ?? null,
          })),
        },
      },
      include: { materiales: true },
    });

    const productoIds = [
      ...new Set(
        creada.materiales
          .map((material) => material.productoId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const ofertas = productoIds.length
      ? await prisma.oferta.findMany({
          where: {
            activo: true,
            productoId: { in: productoIds },
            comercio: { activo: true },
          },
          select: {
            productoId: true,
            precio: true,
            stock: true,
            comercio: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                telefono: true,
                lat: true,
                lng: true,
              },
            },
          },
        })
      : [];

    const materialesCotizables: MaterialCotizable[] = creada.materiales.map(
      (material, indice) => ({
        materialId: material.id,
        nombre: material.nombre,
        cantidad: material.cantidad,
        unidad: material.unidad,
        productoId: material.productoId,
        unidadProducto: resultados[indice]?.match?.unidadProducto ?? null,
      }),
    );

    const comparacion = compararOfertas(materialesCotizables, ofertas, {
      ubicacion: input.ubicacion ?? null,
    });

    const snapshot: ResultadoSnapshot = {
      version: 1,
      comparacion,
      matches: creada.materiales.map((material, indice) => ({
        materialId: material.id,
        match: resultados[indice]?.match ?? null,
        alternativas: resultados[indice]?.alternativas ?? [],
      })),
    };

    await prisma.cotizacion.update({
      where: { id: creada.id },
      data: { resultadoJson: JSON.stringify(snapshot) },
    });

    return {
      cotizacion: aCotizacion(
        creada,
        creada.materiales.map((material, indice) =>
          aMaterialCotizado(material, resultados[indice]),
        ),
      ),
      comparacion,
    };
  },

  async listar(clienteId: string): Promise<Cotizacion[]> {
    const filas = await prisma.cotizacion.findMany({
      where: { clienteId },
      orderBy: { createdAt: "desc" },
      include: { materiales: true },
    });

    return filas.map((fila) => {
      const snapshot = leerSnapshot(fila.resultadoJson);
      return aCotizacion(
        fila,
        fila.materiales.map((material) =>
          aMaterialDesdeSnapshot(material, snapshot),
        ),
      );
    });
  },

  async obtener(
    clienteId: string,
    id: string,
  ): Promise<CotizacionResponse | null> {
    const fila = await prisma.cotizacion.findFirst({
      where: { id, clienteId },
      include: { materiales: true },
    });
    if (!fila) return null;

    const snapshot = leerSnapshot(fila.resultadoJson);
    return {
      cotizacion: aCotizacion(
        fila,
        fila.materiales.map((material) =>
          aMaterialDesdeSnapshot(material, snapshot),
        ),
      ),
      comparacion:
        snapshot?.comparacion ?? comparacionVacia(fila.materiales.length),
    };
  },
};
