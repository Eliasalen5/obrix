import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const JSON_PATH = "C:/Users/HP 255R G10/Desktop/obrix/catalogo-extraido-limpio.json";

function normalizar(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

async function main() {
  console.log("Leyendo JSON:", JSON_PATH);
  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  const items: Array<{ sku: string; nombre: string; unidad: string; categoria: string; descripcion: string }> = JSON.parse(raw);
  
  console.log(`Productos a importar: ${items.length}`);
  
  // Asegurar categorías
  const catMap = new Map<string, string>();
  const cats = await prisma.categoria.findMany();
  for (const c of cats) catMap.set(normalizar(c.nombre), c.id);
  let orden = cats.length + 1;
  
  const catsNecesarias = new Set(items.map(i => i.categoria));
  for (const catNombre of catsNecesarias) {
    const catNorm = normalizar(catNombre);
    if (!catMap.has(catNorm)) {
      const created = await prisma.categoria.create({
        data: { nombre: catNombre, orden: orden++ }
      });
      catMap.set(catNorm, created.id);
      console.log("Creada categoría:", catNombre);
    }
  }
  
  // Obtener SKUs existentes
  const skus = items.map(i => i.sku);
  const existentes = await prisma.producto.findMany({
    where: { sku: { in: skus } },
    select: { sku: true }
  });
  const existentesSet = new Set(existentes.map(e => e.sku));
  
  const nuevos = items.filter(i => !existentesSet.has(i.sku));
  const aActualizar = items.filter(i => existentesSet.has(i.sku));
  
  console.log(`Nuevos: ${nuevos.length}, A actualizar: ${aActualizar.length}`);
  
  // Crear nuevos en lotes
  const createChunkSize = 100;
  for (let i = 0; i < nuevos.length; i += createChunkSize) {
    const chunk = nuevos.slice(i, i + createChunkSize);
    await prisma.producto.createMany({
      data: chunk.map(p => ({
        sku: p.sku,
        nombre: p.nombre,
        unidad: p.unidad,
        categoriaId: catMap.get(normalizar(p.categoria))!,
        descripcion: p.descripcion,
        marca: "",
        fabricante: "",
      })),
      skipDuplicates: true,
    });
    console.log(`Creados ${Math.min(i + createChunkSize, nuevos.length)}/${nuevos.length}`);
  }
  
  // Actualizar existentes en lotes pequeños
  const updateChunkSize = 20;
  for (let i = 0; i < aActualizar.length; i += updateChunkSize) {
    const chunk = aActualizar.slice(i, i + updateChunkSize);
    await Promise.all(
      chunk.map(p =>
        prisma.producto.update({
          where: { sku: p.sku },
          data: {
            nombre: p.nombre,
            unidad: p.unidad,
            categoriaId: catMap.get(normalizar(p.categoria))!,
            descripcion: p.descripcion,
          },
        })
      )
    );
    console.log(`Actualizados ${Math.min(i + updateChunkSize, aActualizar.length)}/${aActualizar.length}`);
  }
  
  const total = await prisma.producto.count();
  console.log(`\nListo. Total productos en maestro: ${total}`);
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
