import type { AiProvider } from "./types";

type Insumo = {
  nombre: string;
  cantidad: number;
  unidad: string;
  notas?: string;
};

type Plantilla = {
  claves: string[];
  titulo: string;
  insumos: Insumo[];
  supuestos: string[];
  aclaraciones: string[];
};

const PLANTILLAS: Plantilla[] = [
  {
    claves: ["parrilla", "asador", "asado"],
    titulo: "Parrilla de obra",
    insumos: [
      { nombre: "Ladrillo común", cantidad: 120, unidad: "unidad", notas: "Base y laterales" },
      { nombre: "Cemento de albañilería", cantidad: 6, unidad: "bolsa 50 kg" },
      { nombre: "Arena gruesa", cantidad: 1, unidad: "m³" },
      { nombre: "Hierro del 8 mm", cantidad: 24, unidad: "unidad", notas: "Refuerzo aproximado" },
      { nombre: "Chapa de hierro", cantidad: 1, unidad: "unidad", notas: "Según tamaño final" },
    ],
    supuestos: ["Parrilla de aproximadamente 1,5 m de ancho", "Mampostería tradicional"],
    aclaraciones: ["Ajustá cantidades según el ancho real y la terminación"],
  },
  {
    claves: ["muro", "pared", "tabique", "cerco"],
    titulo: "Muro / pared de mampostería",
    insumos: [
      { nombre: "Ladrillo hueco 8x18x33", cantidad: 13, unidad: "unidad", notas: "Por m² de muro" },
      { nombre: "Cemento de albañilería", cantidad: 0.2, unidad: "bolsa 50 kg", notas: "Por m² de muro" },
      { nombre: "Arena gruesa", cantidad: 0.02, unidad: "m³", notas: "Por m² de muro" },
    ],
    supuestos: ["Medidas expresadas por m² de muro", "No incluye revoque ni pintura"],
    aclaraciones: ["Indicá alto y largo del muro para calcular el total"],
  },
  {
    claves: ["contrapiso", "piso", "carpeta", "loseta"],
    titulo: "Contrapiso",
    insumos: [
      { nombre: "Cemento Portland", cantidad: 0.5, unidad: "bolsa 50 kg", notas: "Por m²" },
      { nombre: "Arena fina", cantidad: 0.03, unidad: "m³", notas: "Por m²" },
      { nombre: "Piedra partida", cantidad: 0.04, unidad: "m³", notas: "Por m²" },
    ],
    supuestos: ["Espesor de contrapiso de 10 cm"],
    aclaraciones: ["Confirmá la superficie total y el espesor deseado"],
  },
  {
    claves: ["baño", "bano", "sanitario", "cocina", "plomeria", "plomería"],
    titulo: "Instalación sanitaria básica",
    insumos: [
      { nombre: "Caño PVC 110 mm sanitario", cantidad: 6, unidad: "barra 3 m" },
      { nombre: "Caño PVC 50 mm desagüe", cantidad: 4, unidad: "barra 3 m" },
      { nombre: "Cemento Portland", cantidad: 2, unidad: "bolsa 50 kg" },
      { nombre: "Arena gruesa", cantidad: 0.5, unidad: "m³" },
    ],
    supuestos: ["Un ambiente sanitario", "Recorrido corto de cañerías"],
    aclaraciones: ["Un instalador debe verificar el trazado y las pendientes"],
  },
];

const PLANTILLA_GENERAL: Plantilla = {
  claves: [],
  titulo: "Proyecto de obra general",
  insumos: [
    { nombre: "Cemento Portland", cantidad: 5, unidad: "bolsa 50 kg" },
    { nombre: "Arena gruesa", cantidad: 1, unidad: "m³" },
    { nombre: "Hierro del 8 mm", cantidad: 20, unidad: "unidad" },
    { nombre: "Ladrillo común", cantidad: 100, unidad: "unidad" },
  ],
  supuestos: ["Estimación genérica sin medidas específicas"],
  aclaraciones: ["Describí el tipo de obra y las medidas para afinar la lista"],
};

function buscarPlantilla(descripcion: string): Plantilla {
  const texto = descripcion.toLowerCase();
  return (
    PLANTILLAS.find((p) => p.claves.some((k) => texto.includes(k))) ??
    PLANTILLA_GENERAL
  );
}

export class DemoProvider implements AiProvider {
  readonly nombre = "demo";
  readonly esDemo = true;

  async generarProyecto(descripcion: string): Promise<unknown> {
    const plantilla = buscarPlantilla(descripcion);
    const resumen = descripcion.trim().split(/\s+/).slice(0, 8).join(" ");

    return {
      titulo: `${plantilla.titulo} (simulado): ${resumen}`,
      materiales: plantilla.insumos.map((i) => ({ ...i })),
      supuestos: [
        "Respuesta generada en modo de demostración, sin proveedor de IA real.",
        ...plantilla.supuestos,
      ],
      aclaraciones: [
        "Las cantidades son estimaciones orientativas, no un cálculo profesional.",
        ...plantilla.aclaraciones,
      ],
    };
  }
}
