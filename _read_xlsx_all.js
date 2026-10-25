const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/HP 255R G10/Downloads/Catálogo obrix 2026.xlsx');
wb.SheetNames.forEach((name, idx) => {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('\n=== [' + idx + '] ' + name + ' | ' + rows.length + ' filas ===');
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    console.log('  ', JSON.stringify(rows[i]));
  }
});
