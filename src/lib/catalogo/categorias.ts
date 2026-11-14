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
      "Tornillería y fijaciones",
      "Herramientas manuales",
      "Cerraduras, candados y herrajes",
      "Adhesivos, selladores y abrasivos",
    ],
  },
  {
    nombre: "Corralones y materiales de construcción",
    slug: "corralones",
    img: "/corralones.png",
    subcategorias: [
      "Cementos, cales y adhesivos",
      "Arena, piedra y áridos",
      "Ladrillos, bloques y ladrillones",
      "Hierros, mallas y perfiles",
    ],
  },
  {
    nombre: "Pinturerías",
    slug: "pinturerias",
    img: "/pintura.jpg",
    subcategorias: [
      "Pinturas interiores y exteriores",
      "Esmaltes y barnices",
      "Impermeabilizantes y membranas líquidas",
      "Accesorios de pintura (rodillos, pinceles y bandejas)",
    ],
  },
  {
    nombre: "Casas de electricidad",
    slug: "electricidad",
    img: "/electricidad.webp",
    subcategorias: [
      "Cables y conductores",
      "Interruptores, tomacorrientes y fichas",
      "Tableros, térmicas y disyuntores",
      "Iluminación y lámparas",
    ],
  },
  {
    nombre: "Sanitarios, plomería y gas",
    slug: "sanitarios",
    img: "/sanitarios-plomeria.jpg",
    subcategorias: [
      "Griferías y accesorios",
      "Caños y conexiones",
      "Sanitarios y loza",
      "Válvulas, bombas y accesorios de agua",
    ],
  },
  {
    nombre: "Madereras y carpintería",
    slug: "madereras",
    img: "/madera-carpinteria.jpg",
    subcategorias: [
      "Maderas y tirantes",
      "Tableros MDF, melamina y aglomerados",
      "Terciados y fenólicos",
      "Molduras, machimbres y revestimientos",
    ],
  },
  {
    nombre: "Cerámicas, pisos y revestimientos",
    slug: "ceramicas",
    img: "/ladrillos.jpg",
    subcategorias: [
      "Cerámicos para pisos y paredes",
      "Porcelanatos",
      "Revestimientos decorativos",
      "Pastinas, adhesivos y niveladores",
    ],
  },
  {
    nombre: "Techos y zinguería",
    slug: "techos",
    img: "/hierro.jpg",
    subcategorias: [
      "Chapas y paneles para techos",
      "Canaletas y desagües pluviales",
      "Cumbreras, babetas y zinguería",
      "Aislantes térmicos e hidrófugos",
    ],
  },
  {
    nombre: "Vidrierías",
    slug: "vidrierias",
    img: "/vidrierias.jpg",
    subcategorias: [
      "Vidrios comunes y float",
      "Vidrios templados y laminados",
      "Espejos",
      "Accesorios y herrajes para vidrio",
    ],
  },
  {
    nombre: "Máquinas, herramientas y equipos",
    slug: "maquinas",
    img: "/herramientas.jpg",
    subcategorias: [
      "Taladros y atornilladores",
      "Amoladoras y lijadoras",
      "Sierras y máquinas de corte",
      "Compresores y equipos eléctricos",
    ],
  },
];

/** Subcategorías de una categoría por su nombre canónico. */
export function subcategoriasDe(nombreCategoria: string): string[] {
  return (
    CATEGORIAS.find((categoria) => categoria.nombre === nombreCategoria)
      ?.subcategorias ?? []
  );
}

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
