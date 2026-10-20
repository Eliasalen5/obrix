export type CategoriaSeed = {
  nombre: string;
  orden: number;
};

export type ProductoSeed = {
  sku: string;
  nombre: string;
  unidad: string;
  categoria: string;
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

export const categorias: CategoriaSeed[] = [
  { nombre: "Ferreterías", orden: 1 },
  { nombre: "Corralones y materiales de construcción", orden: 2 },
  { nombre: "Pinturerías", orden: 3 },
  { nombre: "Casas de electricidad", orden: 4 },
  { nombre: "Sanitarios, plomería y gas", orden: 5 },
  { nombre: "Casas de pesca y náutica", orden: 6 },
  { nombre: "Madereras y carpintería", orden: 7 },
  { nombre: "Jardinería, viveros y riego", orden: 8 },
  { nombre: "Cerámicas, pisos y revestimientos", orden: 9 },
  { nombre: "Techos y zinguería", orden: 10 },
  { nombre: "Refrigeración y climatización", orden: 11 },
  { nombre: "Seguridad y cerrajería", orden: 12 },
  { nombre: "Piscinas", orden: 13 },
  { nombre: "Máquinas, herramientas y equipos", orden: 14 },
];

export const productosBase: ProductoSeed[] = [];

export const comerciosDemo: ComercioSeed[] = [
  {
    email: "comercio@obrix.local",
    nombre: "Ferretería Demo",
    direccion: "Av. Siempre Viva 742",
    telefono: "11-5555-5555",
    lat: -34.6037,
    lng: -58.3816,
    ofertas: [],
  },
  {
    email: "comercio2@obrix.local",
    nombre: "Corralón Sur",
    direccion: "Av. Calchaquí 1500, Quilmes",
    telefono: "11-4444-4444",
    lat: -34.7245,
    lng: -58.2551,
    ofertas: [],
  },
  {
    email: "comercio3@obrix.local",
    nombre: "Materiales Norte",
    direccion: "Av. Maipú 2100, Olivos",
    telefono: "11-3333-3333",
    lat: -34.51,
    lng: -58.49,
    ofertas: [],
  },
];
