export type CategoriaMenu = {
  nombre: string;
  slug: string;
  img: string;
  subcategorias: string[];
};

export const CATEGORIAS: CategoriaMenu[] = [
  {
    nombre: "Ferreterías",
    slug: "ferreterias",
    img: "/ferreteria.jpg",
    subcategorias: [
      "Herramientas",
      "Fijaciones",
      "Cerraduras y seguridad",
      "Químicos",
    ],
  },
  {
    nombre: "Corralones y materiales de construcción",
    slug: "corralones",
    img: "/corralones.png",
    subcategorias: ["Cemento y cal", "Ladrillos y bloques", "Áridos", "Hierros"],
  },
  {
    nombre: "Pinturerías",
    slug: "pinturerias",
    img: "/pintura.jpg",
    subcategorias: ["Pinturas", "Esmaltes", "Rodillos y pinceles", "Accesorios"],
  },
  {
    nombre: "Casas de electricidad",
    slug: "electricidad",
    img: "/electricidad.webp",
    subcategorias: ["Cables", "Llaves y tomas", "Tableros", "Iluminación"],
  },
  {
    nombre: "Sanitarios, plomería y gas",
    slug: "sanitarios",
    img: "/sanitarios-plomeria.jpg",
    subcategorias: ["Griferías", "Caños y conexiones", "Termotanques", "Gas"],
  },
  {
    nombre: "Madereras y carpintería",
    slug: "madereras",
    img: "/madera-carpinteria.jpg",
    subcategorias: ["Maderas", "Placas", "Herrajes", "Barnices"],
  },
  {
    nombre: "Cerámicas, pisos y revestimientos",
    slug: "ceramicas",
    img: "/ladrillos.jpg",
    subcategorias: ["Cerámicos", "Porcelanatos", "Pisos", "Pegamentos"],
  },
  {
    nombre: "Techos y zinguería",
    slug: "techos",
    img: "/hierro.jpg",
    subcategorias: ["Chapas", "Membranas", "Canaletas", "Aislaciones"],
  },
  {
    nombre: "Vidrierías",
    slug: "vidrierias",
    img: "/vidrierias.jpg",
    subcategorias: ["Vidrios", "Espejos", "DVH", "Perfiles"],
  },
  {
    nombre: "Máquinas, herramientas y equipos",
    slug: "maquinas",
    img: "/herramientas.jpg",
    subcategorias: [
      "Herramientas eléctricas",
      "Máquinas",
      "Equipos",
      "Insumos",
    ],
  },
];

export const LOCALIDADES = [
  "CABA",
  "GBA Norte",
  "GBA Sur",
  "GBA Oeste",
  "La Plata",
  "Córdoba",
  "Rosario",
  "Mendoza",
  "Mar del Plata",
  "Salta",
  "Tucumán",
  "Otra zona",
];
