const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/HP 255R G10/Downloads/Catálogo obrix 2026.xlsx');

let allProducts = [];
const seenSkus = new Set();

function isSku(val) {
  if (val === null || val === undefined || val === '') return false;
  const s = String(val).trim();
  // SKU appears to be numeric codes like 125008, 189030
  if (/^\d{4,6}$/.test(s)) return true;
  return false;
}

function extractProductsFromSheet(sheetName, rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Look for rows that contain a SKU
    for (let j = 0; j < row.length; j++) {
      if (isSku(row[j])) {
        const sku = String(row[j]).trim();
        if (seenSkus.has(sku)) continue;
        
        // Try to find name - often in adjacent columns
        let name = '';
        // Look left and right for name
        for (let k = 0; k < row.length; k++) {
          if (k === j) continue;
          const val = String(row[k]).trim();
          if (val && val.length > 2 && !/^\d+$/.test(val) && !val.match(/^\d+\s*x\s*\d+/) && val !== 'Unidades' && val !== 'por caja' && val !== 'por bolsa' && val !== 'Unidad de venta:') {
            // Likely a product name
            if (val.length > name.length || !name) {
              name = val;
            }
          }
        }
        
        if (name && name.length > 2) {
          seenSkus.add(sku);
          allProducts.push({
            sku,
            name: name.replace(/\.+$/, '').trim(),
            sheet: sheetName,
            rawRow: row
          });
        }
        break;
      }
    }
  }
}

wb.SheetNames.forEach(name => {
  // Skip the index sheets and text sheets
  if (name === 'Indice' || name === 'Text') return;
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  extractProductsFromSheet(name, rows);
});

console.log('Total unique products found:', allProducts.length);
console.log('\n=== Sample products ===');
allProducts.slice(0, 60).forEach((p, i) => {
  console.log((i+1) + '. SKU:', p.sku, '|', p.name, '| Sheet:', p.sheet);
});
console.log('\n=== More samples from different sheets ===');
allProducts.slice(60, 120).forEach((p, i) => {
  console.log((i+61) + '. SKU:', p.sku, '|', p.name, '| Sheet:', p.sheet);
});
