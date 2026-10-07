import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { z } from "zod";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CategoriaSeed = z.enum([
  "CEMENTO_Y_CAL",
  "LADRILLOS_Y_BLOCKS",
  "ARENA_Y_GRAVILLA",
  "HIERROS_Y_MALLAS",
  "TUBERIA_Y_PLOMERIA",
  "ELECTRICIDAD",
  "HERRAJES",
  "PINTURA",
  "ADHESIVOS",
  "CARPINTERIA",
  "OTROS",
]);

const categorias = [
  { nombre: "CEMENTO_Y_CAL", orden: 1 },
  { nombre: "LADRILLOS_Y_BLOCKS", orden: 2 },
  { nombre: "ARENA_Y_GRAVILLA", orden: 3 },
  { nombre: "HIERROS_Y_MALLAS", orden: 4 },
  { nombre: "TUBERIA_Y_PLOMERIA", orden: 5 },
  { nombre: "ELECTRICIDAD", orden: 6 },
  { nombre: "HERRAJES", orden: 7 },
  { nombre: "PINTURA", orden: 8 },
  { nombre: "ADHESIVOS", orden: 9 },
  { nombre: "CARPINTERIA", orden: 10 },
  { nombre: "OTROS", orden: 11 },
] as const;

const productosBase = [
  // Cemento y cal
  { sku: "OBR-001", nombre: "Cemento Portland 50 kg", unidad: "bolsa 50 kg", categoria: "CEMENTO_Y_CAL" },
  { sku: "OBR-002", nombre: "Cemento de Albañilería 50 kg", unidad: "bolsa 50 kg", categoria: "CEMENTO_Y_CAL" },
  { sku: "OBR-003", nombre: "Cal Hidráulica 25 kg", unidad: "bolsa 25 kg", categoria: "CEMENTO_Y_CAL" },
  { sku: "OBR-004", nombre: "Yeso Para Revoque 20 kg", unidad: "bolsa 20 kg", categoria: "CEMENTO_Y_CAL" },
  // Ladrillos
  { sku: "OBR-005", nombre: "Ladrillo Común 8x18x33 cm", unidad: "unidad", categoria: "LADRILLOS_Y_BLOCKS" },
  { sku: "OBR-006", nombre: "Ladrillo Hueco 8x18x33 cm", unidad: "unidad", categoria: "LADRILLOS_Y_BLOCKS" },
  { sku: "OBR-007", nombre: "Bloque Cerámico 12x19x39 cm", unidad: "unidad", categoria: "LADRILLOS_Y_BLOCKS" },
  { sku: "OBR-008", nombre: "Bloque HCCA 15x20x40 cm", unidad: "unidad", categoria: "LADRILLOS_Y_BLOCKS" },
  { sku: "OBR-009", nombre: "Ladrillo Refractario", unidad: "unidad", categoria: "LADRILLOS_Y_BLOCKS" },
  // Arena y gravilla
  { sku: "OBR-010", nombre: "Arena Fina", unidad: "m³", categoria: "ARENA_Y_GRAVILLA" },
  { sku: "OBR-011", nombre: "Arena Gruesa", unidad: "m³", categoria: "ARENA_Y_GRAVILLA" },
  { sku: "OBR-012", nombre: "Gravilla 6-10 mm", unidad: "m³", categoria: "ARENA_Y_GRAVILLA" },
  { sku: "OBR-013", nombre: "Piedra Partida", unidad: "m³", categoria: "ARENA_Y_GRAVILLA" },
  // Hierros
  { sku: "OBR-014", nombre: "Hierro 6 mm", unidad: "kg", categoria: "HIERROS_Y_MALLAS" },
  { sku: "OBR-015", nombre: "Hierro 8 mm", unidad: "kg", categoria: "HIERROS_Y_MALLAS" },
  { sku: "OBR-016", nombre: "Hierro 10 mm", unidad: "kg", categoria: "HIERROS_Y_MALLAS" },
  { sku: "OBR-017", nombre: "Hierro 12 mm", unidad: "kg", categoria: "HIERROS_Y_MALLAS" },
  { sku: "OBR-018", nombre: "Malla Electrosoldada 15x15 4,2 mm", unidad: "rollo", categoria: "HIERROS_Y_MALLAS" },
  // Tubería
  { sku: "OBR-019", nombre: "Caño PVC 110 mm Sanitario", unidad: "barra 3 m", categoria: "TUBERIA_Y_PLOMERIA" },
  { sku: "OBR-020", nombre: "Caño PVC 50 mm Desagüe", unidad: "barra 3 m", categoria: "TUBERIA_Y_PLOMERIA" },
  { sku: "OBR-021", nombre: "Caño PVC 20 mm Agua", unidad: "barra 4 m", categoria: "TUBERIA_Y_PLOMERIA" },
  { sku: "OBR-022", nombre: "Codo PVC 110 mm 90°", unidad: "unidad", categoria: "TUBERIA_Y_PLOMERIA" },
  { sku: "OBR-023", nombre: "Unión Flex 20 mm", unidad: "unidad", categoria: "TUBERIA_Y_PLOMERIA" },
  { sku: "OBR-024", nombre: "Válvula Esfera 1/2\"", unidad: "unidad", categoria: "TUBERIA_Y_PLOMERIA" },
  { sku: "OBR-025", nombre: "Tapón PVC", unidad: "unidad", categoria: "TUBERIA_Y_PLOMERIA" },
  // Electricidad
  { sku: "OBR-026", nombre: "Cable 2,5 mm²", unidad: "metro", categoria: "ELECTRICIDAD" },
  { sku: "OBR-027", nombre: "Cable 4 mm²", unidad: "metro", categoria: "ELECTRICIDAD" },
  { sku: "OBR-028", nombre: "Cable 1,5 mm²", unidad: "metro", categoria: "ELECTRICIDAD" },
  { sku: "OBR-029", nombre: "Toma Corriente 10 A", unidad: "unidad", categoria: "ELECTRICIDAD" },
  { sku: "OBR-030", nombre: "Llave Combinada 10 A", unidad: "unidad", categoria: "ELECTRICIDAD" },
  { sku: "OBR-031", nombre: "Caja Octogonal", unidad: "unidad", categoria: "ELECTRICIDAD" },
  { sku: "OBR-032", nombre: "Cinta Aisladora", unidad: "rollo", categoria: "ELECTRICIDAD" },
  // Herrajes
  { sku: "OBR-033", nombre: "Tornillo 8x1\"", unidad: "unidad", categoria: "HERRAJES" },
  { sku: "OBR-034", nombre: "Tornillo 6x1/2\"", unidad: "unidad", categoria: "HERRAJES" },
  { sku: "OBR-035", nombre: "Tornillo 10x1 1/2\"", unidad: "unidad", categoria: "HERRAJES" },
  { sku: "OBR-036", nombre: "Tarugo Nylon 6 mm", unidad: "unidad", categoria: "HERRAJES" },
  { sku: "OBR-037", nombre: "Bisagra 3\"", unidad: "unidad", categoria: "HERRAJES" },
  { sku: "OBR-038", nombre: "Cerradura Tambor", unidad: "unidad", categoria: "HERRAJES" },
  { sku: "OBR-039", nombre: "Manija", unidad: "unidad", categoria: "HERRAJES" },
  // Pintura
  { sku: "OBR-040", nombre: "Pintura Látex Interior 20 L", unidad: "balde 20 L", categoria: "PINTURA" },
  { sku: "OBR-041", nombre: "Pintura Látex Exterior 20 L", unidad: "balde 20 L", categoria: "PINTURA" },
  { sku: "OBR-042", nombre: "Esmalte Sintético 4 L", unidad: "balde 4 L", categoria: "PINTURA" },
  { sku: "OBR-043", nombre: "Anticorrosivo 4 L", unidad: "balde 4 L", categoria: "PINTURA" },
  { sku: "OBR-044", nombre: "Enduido Interior 5 kg", unidad: "bolsa 5 kg", categoria: "PINTURA" },
  { sku: "OBR-045", nombre: "Fondo Liso 4 L", unidad: "balde 4 L", categoria: "PINTURA" },
  { sku: "OBR-046", nombre: "Diluyente Universal 4 L", unidad: "balde 4 L", categoria: "PINTURA" },
  // Adhesivos
  { sku: "OBR-047", nombre: "Pegamento Cerámico 20 kg", unidad: "bolsa 20 kg", categoria: "ADHESIVOS" },
  { sku: "OBR-048", nombre: "Masilla para Madera 1 kg", unidad: "tarro 1 kg", categoria: "ADHESIVOS" },
  { sku: "OBR-049", nombre: "Silicona Neutra 280 ml", unidad: "cartucho 280 ml", categoria: "ADHESIVOS" },
  { sku: "OBR-050", nombre: "Silicona Acética 280 ml", unidad: "cartucho 280 ml", categoria: "ADHESIVOS" },
  { sku: "OBR-051", nombre: "Adhesivo Estructural 1 kg", unidad: "tarro 1 kg", categoria: "ADHESIVOS" },
  // Carpintería
  { sku: "OBR-052", nombre: "Madera Pino 1x2\"", unidad: "metro lineal", categoria: "CARPINTERIA" },
  { sku: "OBR-053", nombre: "Madera Pino 1x4\"", unidad: "metro lineal", categoria: "CARPINTERIA" },
  { sku: "OBR-054", nombre: "Madera Pino 2x2\"", unidad: "metro lineal", categoria: "CARPINTERIA" },
  { sku: "OBR-055", nombre: "Tablero Terciado 6 mm 120x240", unidad: "planchuela", categoria: "CARPINTERIA" },
  { sku: "OBR-056", nombre: "Tablero Terciado 9 mm 120x240", unidad: "planchuela", categoria: "CARPINTERIA" },
  { sku: "OBR-057", nombre: "Listón Machimbrado", unidad: "metro lineal", categoria: "CARPINTERIA" },
  // Otros útiles
  { sku: "OBR-058", nombre: "Clavos 2\"", unidad: "kg", categoria: "OTROS" },
  { sku: "OBR-059", nombre: "Clavos 1 1/2\"", unidad: "kg", categoria: "OTROS" },
  { sku: "OBR-060", nombre: "Clavos de Albañil 3\"", unidad: "kg", categoria: "OTROS" },
  { sku: "OBR-061", nombre: "Alambre Galvanizado Nº 14", unidad: "kg", categoria: "OTROS" },
  { sku: "OBR-062", nombre: "Alambre Negro Nº 16", unidad: "kg", categoria: "OTROS" },
  { sku: "OBR-063", nombre: "Esponja Abrasiva", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-064", nombre: "Paño de Limpieza", unidad: "paquete", categoria: "OTROS" },
  { sku: "OBR-065", nombre: "Cabo de Madera para Pala", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-066", nombre: "Pala", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-067", nombre: "Carretilla", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-068", nombre: "Nivel de Agua 8 m", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-069", nombre: "Cinta Métrica 5 m", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-070", nombre: "Guantes de Trabajo", unidad: "par", categoria: "OTROS" },
  { sku: "OBR-071", nombre: "Lentes de Protección", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-072", nombre: "Casco de Seguridad", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-073", nombre: "Mascarilla Descartable", unidad: "caja 10 u", categoria: "OTROS" },
  { sku: "OBR-074", nombre: "Arena Sílice", unidad: "m³", categoria: "OTROS" },
  { sku: "OBR-075", nombre: "Fieltro Asfáltico", unidad: "rollo", categoria: "OTROS" },
  { sku: "OBR-076", nombre: "Membrana Líquida", unidad: "litro", categoria: "OTROS" },
  { sku: "OBR-077", nombre: "Balde Plástico 20 L", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-078", nombre: "Brocha 2\"", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-079", nombre: "Rodillo de Lana", unidad: "unidad", categoria: "OTROS" },
  { sku: "OBR-080", nombre: "Cinta de Enmascarar", unidad: "rollo", categoria: "OTROS" },
] as const;

async function main() {
  // upsert categorías
  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: c.nombre },
      create: { nombre: c.nombre, orden: c.orden },
      update: { orden: c.orden },
    });
  }
  const catMap = new Map(
    (await prisma.categoria.findMany()).map((c) => [c.nombre, c.id]),
  );
  let created = 0;
  for (const p of productosBase) {
    const cid = catMap.get(p.categoria);
    if (!cid) continue;
    await prisma.producto.upsert({
      where: { sku: p.sku },
      create: {
        sku: p.sku,
        nombre: p.nombre,
        unidad: p.unidad,
        categoriaId: cid,
        descripcion: "",
      },
      update: {
        nombre: p.nombre,
        unidad: p.unidad,
        categoriaId: cid,
      },
    });
    created++;
  }
  console.log(`Seed OK: ${created} productos upserted, categorías: ${categorias.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
