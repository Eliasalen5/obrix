import { CATEGORIAS } from "../src/lib/catalogo/categorias";

export type CategoriaSeed = {
  nombre: string;
  orden: number;
};

export type SubcategoriaSeed = {
  categoria: string;
  nombre: string;
  orden: number;
};

export type ProductoSeed = {
  sku: string;
  nombre: string;
  unidad: string;
  categoria: string;
  subcategoria: string;
  descripcion: string;
};

export type OfertaSeed = {
  sku: string;
  precio: number;
  stock: number;
  marca: string;
};

export type ComercioSeed = {
  email: string;
  nombre: string;
  direccion: string;
  telefono: string;
  lat: number;
  lng: number;
  ofertas: OfertaSeed[];
};

export const categorias: CategoriaSeed[] = CATEGORIAS.map((categoria, i) => ({
  nombre: categoria.nombre,
  orden: i + 1,
}));

// Las subcategorías se derivan de la taxonomía compartida para no duplicar datos.
export const subcategorias: SubcategoriaSeed[] = CATEGORIAS.flatMap(
  (categoria) =>
    categoria.subcategorias.map((nombre, i) => ({
      categoria: categoria.nombre,
      nombre,
      orden: i + 1,
    })),
);

export const productosBase: ProductoSeed[] = [
  {
    sku: "OBR-001",
    nombre: "Tornillos autoperforantes 8x1\" (caja x100)",
    unidad: "caja x100",
    categoria: "Ferreterías",
    subcategoria: "Tornillería y fijaciones",
    descripcion: "Caja de 100 tornillos autoperforantes punta mecha.",
  },
  {
    sku: "OBR-002",
    nombre: "Martillo de acero con mango de fibra 500 g",
    unidad: "unidad",
    categoria: "Ferreterías",
    subcategoria: "Herramientas manuales",
    descripcion: "Martillo de acero forjado con mango antideslizante.",
  },
  {
    sku: "OBR-003",
    nombre: "Cemento Portland CPN 50 kg",
    unidad: "bolsa 50 kg",
    categoria: "Corralones y materiales de construcción",
    subcategoria: "Cementos, cales y adhesivos",
    descripcion: "Cemento de uso general para hormigón y mampostería.",
  },
  {
    sku: "OBR-004",
    nombre: "Hierro nervado 8 mm x 12 m",
    unidad: "barra 12 m",
    categoria: "Corralones y materiales de construcción",
    subcategoria: "Hierros, mallas y perfiles",
    descripcion: "Barra de acero nervado para hormigón armado.",
  },
  {
    sku: "OBR-005",
    nombre: "Látex interior blanco mate 20 L",
    unidad: "balde 20 L",
    categoria: "Pinturerías",
    subcategoria: "Pinturas interiores y exteriores",
    descripcion: "Pintura látex lavable para interiores, alto rendimiento.",
  },
  {
    sku: "OBR-006",
    nombre: "Cable unipolar 2,5 mm² x 100 m",
    unidad: "rollo 100 m",
    categoria: "Casas de electricidad",
    subcategoria: "Cables y conductores",
    descripcion: "Cable de cobre con aislación para instalación eléctrica.",
  },
  {
    sku: "OBR-007",
    nombre: "Grifería monocomando de cocina",
    unidad: "unidad",
    categoria: "Sanitarios, plomería y gas",
    subcategoria: "Griferías y accesorios",
    descripcion: "Monocomando cromado con caño giratorio.",
  },
  {
    sku: "OBR-008",
    nombre: "Tablero MDF 18 mm 1,83 x 2,60 m",
    unidad: "placa",
    categoria: "Madereras y carpintería",
    subcategoria: "Tableros MDF, melamina y aglomerados",
    descripcion: "Placa MDF cruda para muebles y revestimientos.",
  },
  {
    sku: "OBR-009",
    nombre: "Porcelanato rectificado 60 x 60 cm",
    unidad: "m²",
    categoria: "Cerámicas, pisos y revestimientos",
    subcategoria: "Porcelanatos",
    descripcion: "Porcelanato rectificado de primera calidad para pisos.",
  },
  {
    sku: "OBR-010",
    nombre: "Chapa sinusoidal galvanizada N°25",
    unidad: "m²",
    categoria: "Techos y zinguería",
    subcategoria: "Chapas y paneles para techos",
    descripcion: "Chapa ondulada galvanizada para cubiertas.",
  },
  {
    sku: "OBR-011",
    nombre: "Vidrio float transparente 4 mm",
    unidad: "m²",
    categoria: "Vidrierías",
    subcategoria: "Vidrios comunes y float",
    descripcion: "Vidrio float incoloro para aberturas y cerramientos.",
  },
  {
    sku: "OBR-012",
    nombre: "Taladro percutor 650 W",
    unidad: "unidad",
    categoria: "Máquinas, herramientas y equipos",
    subcategoria: "Taladros y atornilladores",
    descripcion: "Taladro percutor con velocidad variable y mandril 13 mm.",
  },
];

export const comerciosDemo: ComercioSeed[] = [
  {
    email: "comercio@obrix.local",
    nombre: "Ferretería Demo",
    direccion: "Av. Siempre Viva 742",
    telefono: "11-5555-5555",
    lat: -34.6037,
    lng: -58.3816,
    ofertas: [
      { sku: "OBR-001", precio: 8500, stock: 40, marca: "Genérica" },
      { sku: "OBR-002", precio: 12900, stock: 15, marca: "Truper" },
      { sku: "OBR-005", precio: 42000, stock: 20, marca: "Alba" },
      { sku: "OBR-006", precio: 38500, stock: 12, marca: "Argenplas" },
      { sku: "OBR-007", precio: 55000, stock: 8, marca: "FV" },
    ],
  },
  {
    email: "comercio2@obrix.local",
    nombre: "Corralón Sur",
    direccion: "Av. Calchaquí 1500, Quilmes",
    telefono: "11-4444-4444",
    lat: -34.7245,
    lng: -58.2551,
    ofertas: [
      { sku: "OBR-003", precio: 9800, stock: 200, marca: "Loma Negra" },
      { sku: "OBR-004", precio: 14500, stock: 120, marca: "Acindar" },
      { sku: "OBR-009", precio: 16500, stock: 80, marca: "Cerámica San Lorenzo" },
      { sku: "OBR-010", precio: 11200, stock: 300, marca: "Siderar" },
    ],
  },
  {
    email: "comercio3@obrix.local",
    nombre: "Materiales Norte",
    direccion: "Av. Maipú 2100, Olivos",
    telefono: "11-3333-3333",
    lat: -34.51,
    lng: -58.49,
    ofertas: [
      { sku: "OBR-003", precio: 10200, stock: 150, marca: "Loma Negra" },
      { sku: "OBR-005", precio: 45000, stock: 10, marca: "Sherwin Williams" },
      { sku: "OBR-008", precio: 78000, stock: 25, marca: "Arauco" },
      { sku: "OBR-011", precio: 22500, stock: 60, marca: "VASA" },
      { sku: "OBR-012", precio: 89000, stock: 6, marca: "Bosch" },
    ],
  },
];
