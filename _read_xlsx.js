const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/HP 255R G10/Downloads/Catálogo obrix 2026.xlsx');
console.log('sheets:', wb.SheetNames);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
console.log('total rows:', rows.length);
for (let i = 0; i < Math.min(40, rows.length); i++) {
  console.log(JSON.stringify(rows[i]));
}
