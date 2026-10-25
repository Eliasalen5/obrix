import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const EXCEL_PATH = "C:/Users/HP 255R G10/Downloads/Catálogo obrix 2026.xlsx";

// Mapear hojas del excel a categorías existentes o nuevas
const HOJA_A_CATEGORIA: Record<string, string> = {
  "AguaSanitarios": "Sanitarios, plomería y gas",
  "AguaSanitarios (2)": "Sanitarios, plomería y gas",
  "AguaSanitarios (3)": "Sanitarios, plomería y gas",
  "AguaSanitarios (4)": "Sanitarios, plomería y gas",
  "AguaSanitarios (5)": "Sanitarios, plomería y gas",
  "AguaSanitarios (6)": "Sanitarios, plomería y gas",
  "AguaSanitarios (7)": "Sanitarios, plomería y gas",
  "AguaSanitarios (8)": "Sanitarios, plomería y gas",
  "GasSanitarios": "Sanitarios, plomería y gas",
  "GasSanitarios (2)": "Sanitarios, plomería y gas",
  "GasSanitarios (3)": "Sanitarios, plomería y gas",
  "GasSanitarios (4)": "Sanitarios, plomería y gas",
  "GasSanitarios (5)": "Sanitarios, plomería y gas",
  "Electricidad": "Casas de electricidad",
  "Seguridad e Higiene": "Seguridad y cerrajería",
  "Seguridad e Higiene (2)": "Seguridad y cerrajería",
  "Seguridad e Higiene (3)": "Seguridad y cerrajería",
  "Seguridad e Higiene (4)": "Seguridad y cerrajería",
  "Herrajes": "Seguridad y cerrajería",
  "Herrajes (2)": "Seguridad y cerrajería",
  "Herrajes (3)": "Seguridad y cerrajería",
  "Herrajes (4)": "Seguridad y cerrajería",
  "Herrajes (5)": "Seguridad y cerrajería",
  "Herrajes (6)": "Seguridad y cerrajería",
  "Herrajes (7)": "Seguridad y cerrajería",
  "Herrajes (8)": "Seguridad y cerrajería",
  "Herrajes (9)": "Seguridad y cerrajería",
  "Herrajes (10)": "Seguridad y cerrajería",
  "Herrajes (11)": "Seguridad y cerrajería",
  "Cerámicas": "Cerámicas, pisos y revestimientos",
  "Pintureria": "Pinturerías",
  "Jardineria": "Jardinería, viveros y riego",
  "Maderera": "Madereras y carpintería",
  "Techos": "Techos y zinguería",
};

const BASURA = [
  "unidades",
  "por caja",
  "por bolsa",
  "unidad de venta",
  "venta por",
  "de venta",
  "medida",
  "composición",
  "características",
  "código",
  "página",
  "ver ",
];

function normalizar(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function esBasura(s: string): boolean {
  if (!s || s.length < 2) return true;
  const n = normalizar(s);
  if (/^\d+\s*x\s*\d+/.test(s)) return true; // medidas
  if (/^\d+\s*(mm|cm|m|kg|l|pulg)/i.test(s)) return true;
  if (/^[\d\s\/\-\.\"]+$/.test(s)) return true;
  for (const b of BASURA) {
    if (n.includes(b)) return true;
  }
  return false;
}

function esSku(v: any): boolean {
  if (v === null || v === undefined || v === "") return false;
  const s = String(v).trim();
  if (/^\d{4,6}$/.test(s)) return true;
  return false;
}

function inferirUnidad(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("rollo")) return "rollo";
  if (n.includes("bolsa")) return "bolsa";
  if (n.includes("kg")) return "kg";
  if (n.includes("m ") || n.includes(" metro")) return "m";
  if (n.includes("litro") || n.match(/\b(l|lt)\b/)) return "lt";
  if (n.includes("par")) return "par";
  if (n.includes("juego")) return "juego";
  if (n.includes("caja")) return "unidad";
  return "unidad";
}

async function main() {
  console.log("Leyendo Excel...");
  const wb = XLSX.readFile(EXCEL_PATH);
  
  const catMap = new Map<string, string>();
  const cats = await prisma.categoria.findMany();
  for (const c of cats) catMap.set(normalizar(c.nombre), c.id);
  let orden = cats.length + 1;
  
  const productosMap = new Map<string, { sku: string; nombre: string; unidad: string; categoriaId: string; descripcion: string }>();
  
  for (const sheetName of wb.SheetNames) {
    if (sheetName === "Indice" || sheetName === "Text") continue;
    
    const catNombre = HOJA_A_CATEGORIA[sheetName] || "Ferreterías";
    const catNorm = normalizar(catNombre);
    if (!catMap.has(catNorm)) {
      const created = await prisma.categoria.create({
        data: { nombre: catNombre, orden: orden++ }
      });
      catMap.set(catNorm, created.id);
      console.log("Creada categoría:", catNombre);
    }
    const categoriaId = catMap.get(catNorm)!;
    
    const ws = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // buscar SKU
      for (let j = 0; j < row.length; j++) {
        if (!esSku(row[j])) continue;
        const sku = String(row[j]).trim();
        if (productosMap.has(sku)) break;
        
        // buscar nombre descriptivo en la misma fila
        let mejorNombre = "";
        for (let k = 0; k < row.length; k++) {
          if (k === j) continue;
          const val = String(row[k]).trim();
          if (esBasura(val)) continue;
          if (val.length < 4) continue;
          if (/^\d+$/.test(val)) continue;
          // preferir nombres más largos y descriptivos
          if (val.length > mejorNombre.length) {
            mejorNombre = val;
          }
        }
        
        if (mejorNombre && mejorNombre.length >= 4) {
          // limpiar nombre
          mejorNombre = mejorNombre
            .replace(/\s+/g, " ")
            .replace(/^[\.\-]+\s*/, "")
            .replace(/\s*[\.\-]+$/, "")
            .trim();
          
          productosMap.set(sku, {
            sku,
            nombre: mejorNombre,
            unidad: inferirUnidad(mejorNombre),
            categoriaId,
            descripcion: mejorNombre,
          });
        }
        break;
      }
    }
  }
  
  console.log(`\nProductos únicos extraídos: ${productosMap.size}`);
  console.log("Cargando al catálogo maestro...");
  
  let creados = 0;
  let actualizados = 0;
  
  for (const prod of productosMap.values()) {
    const existing = await prisma.producto.findUnique({ where: { sku: prod.sku } });
    if (existing) {
      await prisma.producto.update({
        where: { sku: prod.sku },
        data: {
          nombre: prod.nombre,
          unidad: prod.unidad,
          categoriaId: prod.categoriaId,
          descripcion: prod.descripcion,
        },
      });
      actualizados++;
    } else {
      await prisma.producto.create({
        data: {
          sku: prod.sku,
          nombre: prod.nombre,
          unidad: prod.unidad,
          categoriaId: prod.categoriaId,
          descripcion: prod.descripcion,
        },
      });
      creados++;
    }
  }
  
  console.log(`\nListo: ${creados} creados, ${actualizados} actualizados`);
  const total = await prisma.producto.count();
  console.log(`Total productos en maestro: ${total}`);
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
