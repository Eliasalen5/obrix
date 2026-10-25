import "dotenv/config";
import * as fs from "fs";
import * as XLSX from "xlsx";

const EXCEL_PATH = "C:/Users/HP 255R G10/Downloads/Catálogo obrix 2026.xlsx";
const OUT_PATH = "C:/Users/HP 255R G10/Desktop/obrix/catalogo-extraido.json";

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
  "Sanitarios": "Sanitarios, plomería y gas",
  "Sanitarios (2)": "Sanitarios, plomería y gas",
  "Sanitarios (3)": "Sanitarios, plomería y gas",
  "Sanitarios (4)": "Sanitarios, plomería y gas",
  "Electricidad": "Casas de electricidad",
  "Monofásico": "Casas de electricidad",
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
  "Herrajes (12)": "Seguridad y cerrajería",
  "Cerámicas": "Cerámicas, pisos y revestimientos",
  "Pintureria": "Pinturerías",
  "Pintureria (2)": "Pinturerías",
  "Pintureria (3)": "Pinturerías",
  "Pintureria (4)": "Pinturerías",
  "Jardineria, Agro y Riego": "Jardinería, viveros y riego",
  "Jardineria, Agro y Riego (2)": "Jardinería, viveros y riego",
  "Jardineria, Agro y Riego (3)": "Jardinería, viveros y riego",
  "Jardineria, Agro y Riego (4)": "Jardinería, viveros y riego",
  "Mangueras": "Jardinería, viveros y riego",
  "Maderera": "Madereras y carpintería",
  "Cabos y accesorios de madera": "Madereras y carpintería",
  "Techos": "Techos y zinguería",
  "Ferreteria general": "Ferreterías",
  "Ferreteria general (2)": "Ferreterías",
  "Ferreteria general (3)": "Ferreterías",
  "Ferreteria general (4)": "Ferreterías",
  "Ferreteria general (5)": "Ferreterías",
  "Ferreteria general (6)": "Ferreterías",
  "Ferreteria general (7)": "Ferreterías",
  "Ferreteria general (8)": "Ferreterías",
  "Ferreteria general (9)": "Ferreterías",
  "Ferreteria general (10)": "Ferreterías",
  "Ferreteria general (11)": "Ferreterías",
  "Ferreteria general (12)": "Ferreterías",
  "Ferreteria general (13)": "Ferreterías",
  "Ferreteria general (14)": "Ferreterías",
  "Ferreteria general (15)": "Ferreterías",
  "Ferreteria general (16)": "Ferreterías",
  "Ferreteria general (17)": "Ferreterías",
  "Ferreteria general (18)": "Ferreterías",
  "Ferreteria general (19)": "Ferreterías",
  "Ferreteria general (20)": "Ferreterías",
  "Ferreteria general (21)": "Ferreterías",
  "Ferreteria general (22)": "Ferreterías",
  "Ferreteria general (23)": "Ferreterías",
  "Ferreteria general (24)": "Ferreterías",
  "Abrazaderas": "Ferreterías",
  "Abrazaderas (2)": "Ferreterías",
  "Accesorios de automotor": "Ferreterías",
  "Accesorios de automotor (2)": "Ferreterías",
  "Acc. de aire, gomeria y lubrica": "Ferreterías",
  "Herramientas y acc. de construc": "Ferreterías",
  "Herramientas y acc. de cons (2)": "Ferreterías",
  "Herramientas y acc. de cons (3)": "Ferreterías",
  "Herramientas y acc. de cons (4)": "Ferreterías",
  "Herramientas y acc. de cons (5)": "Ferreterías",
  "Herramientas y acc. de cons (6)": "Ferreterías",
  "Varios": "Ferreterías",
  "Varios (2)": "Ferreterías",
  "Fijación y accesorios de bulone": "Ferreterías",
  "Fijación y accesorios de bu (2)": "Ferreterías",
  "Films y tejidos": "Ferreterías",
  "Films y tejidos (2)": "Ferreterías",
  "QuímicosFerreteria general": "Ferreterías",
  "QuímicosFerreteria general (2)": "Ferreterías",
  "Ruedas": "Ferreterías",
  "Ruedas (2)": "Ferreterías",
  "Ruedas (3)": "Ferreterías",
};

function limpiarTexto(s: string): string {
  if (!s) return "";
  return String(s)
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\.\-\:\;]+\s*/, "")
    .replace(/\s*[\.\-\:\;]+$/, "")
    .trim();
}

function esSku(v: any): boolean {
  if (v === null || v === undefined || v === "") return false;
  const s = String(v).trim();
  if (/^\d{4,6}$/.test(s)) return true;
  return false;
}

function esCabeceraMedida(val: string): boolean {
  const n = val.toLowerCase().replace(/\s+/g, " ").trim();
  if (!n) return false;
  if (n === "medida") return true;
  if (n.startsWith("medida")) return true;
  if (n.includes("unidades por")) return true;
  if (n.includes("unidad de venta")) return true;
  return false;
}

function esBasuraTexto(val: string): boolean {
  if (!val) return true;
  const n = val.toLowerCase().replace(/\s+/g, " ").trim();
  if (n.length < 3) return true;
  if (/^ver\b/i.test(val)) return true;
  if (/página|pagina/i.test(n)) return true;
  if (/unidades por|por caja|por bolsa|por bulto|por display/i.test(n)) return true;
  if (/de venta/i.test(n)) return true;
  if (/^sheet\d+/i.test(n)) return true;
  if (/^indice$/i.test(n)) return true;
  if (/^[\d\s\/\-\.\,\"]+$/.test(val)) return true;
  if (/^\d+\s*x\s*\d+/i.test(val)) return true;
  if (/^\d+\s*(mm|cm|m|kg|l|lt|pulg|")/i.test(val)) return true;
  return false;
}

function pareceMedida(val: string): boolean {
  if (!val) return false;
  const n = val.trim();
  if (/^\d+\s*x\s*[\d\/\,\.\"\s]+$/i.test(n)) return true;
  if (/^[\d\/\,\.]+\s*["”]?$/.test(n)) return true;
  if (/^\d+\s*x\s*\d+\s*x\s*[\d\,\.]+/i.test(n)) return true;
  if (/medida\s*:/i.test(n)) return true;
  return false;
}

function esNombreValido(nombre: string): boolean {
  if (!nombre) return false;
  const n = nombre.toLowerCase().replace(/\s+/g, " ").trim();
  if (n.length < 4) return false;
  if (n === "unidades" || n === "medida" || n === "medidas") return false;
  if (/^ver\b/.test(n)) return false;
  if (/unidades por|por caja|por bolsa|por bulto/.test(n)) return false;
  return true;
}

function inferirUnidad(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("rollo")) return "rollo";
  if (n.includes("bolsa")) return "bolsa";
  if (n.includes("kg")) return "kg";
  if (n.match(/\bm\b/) || n.includes(" metro")) return "m";
  if (n.includes("litro") || /\b(l|lt)\b/.test(n)) return "lt";
  if (n.includes("par")) return "par";
  if (n.includes("juego")) return "juego";
  if (n.includes("caja")) return "caja";
  if (n.includes("bulto")) return "bulto";
  if (n.includes("display")) return "display";
  return "unidad";
}

function main() {
  console.log("Leyendo Excel:", EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);

  const productosMap = new Map<string, { sku: string; nombre: string; unidad: string; categoria: string; descripcion: string }>();

  for (const sheetName of wb.SheetNames) {
    if (sheetName === "Indice" || sheetName === "Text") continue;
    if (/^Sheet\d+$/i.test(sheetName)) continue;

    const catNombre = HOJA_A_CATEGORIA[sheetName] || "Ferreterías";
    const ws = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    let grupoActual = "";
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rowClean = row.map((v) => limpiarTexto(String(v)));
      const tieneHeaderMedida = rowClean.some((v) => esCabeceraMedida(v));
      if (tieneHeaderMedida) {
        continue;
      }

      const skuCols: number[] = [];
      for (let j = 0; j < rowClean.length; j++) {
        if (esSku(rowClean[j])) skuCols.push(j);
      }
      if (skuCols.length === 0) {
        for (let j = 0; j < rowClean.length; j++) {
          const val = rowClean[j];
          if (!val) continue;
          if (esBasuraTexto(val)) continue;
          if (pareceMedida(val)) continue;
          if (/^\d+$/.test(val)) continue;
          if (val.length >= 4 && val.length <= 80) {
            const lower = val.toLowerCase();
            if (lower.includes("ver ") || lower.includes("página") || lower.includes("unidades")) continue;
            grupoActual = val;
            break;
          }
        }
        continue;
      }

      let medida = "";
      for (let j = 0; j < rowClean.length; j++) {
        if (skuCols.includes(j)) continue;
        const val = rowClean[j];
        if (!val) continue;
        if (esBasuraTexto(val)) continue;
        if (pareceMedida(val)) {
          medida = val;
          break;
        }
        if (/^\d/.test(val) && val.length <= 25 && !/ver/i.test(val) && !/unidades/i.test(val)) {
          medida = val;
          break;
        }
      }

      let nombreProducto = "";
      if (grupoActual && medida) {
        nombreProducto = limpiarTexto(`${grupoActual} ${medida}`);
      } else if (grupoActual && !medida) {
        nombreProducto = grupoActual;
      } else if (!grupoActual && medida) {
        nombreProducto = medida;
      } else {
        for (let j = 0; j < rowClean.length; j++) {
          if (skuCols.includes(j)) continue;
          const val = rowClean[j];
          if (!val || esBasuraTexto(val)) continue;
          if (val.length > nombreProducto.length) nombreProducto = val;
        }
      }

      if (!esNombreValido(nombreProducto)) continue;

      for (const sj of skuCols) {
        const sku = rowClean[sj];
        if (productosMap.has(sku)) continue;
        productosMap.set(sku, {
          sku,
          nombre: nombreProducto,
          unidad: inferirUnidad(nombreProducto + " " + medida),
          categoria: catNombre,
          descripcion: nombreProducto,
        });
      }
    }
  }

  const items = Array.from(productosMap.values());
  fs.writeFileSync(OUT_PATH, JSON.stringify(items, null, 2));
  console.log(`Exportados ${items.length} productos únicos válidos a: ${OUT_PATH}`);
}

main();
