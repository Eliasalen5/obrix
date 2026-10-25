const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/HP 255R G10/Downloads/Catálogo obrix 2026.xlsx');

// Look at sheets with actual product data
const interesting = ['AguaSanitarios', 'AguaSanitarios (2)', 'AguaSanitarios (3)', 'GasSanitarios', 'Seguridad e Higiene', 'Ferreteria general (18)'];
interesting.forEach(name => {
  if (!wb.SheetNames.includes(name)) return;
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('\n========== ' + name + ' (' + rows.length + ' rows) ==========');
  for (let i = 0; i < Math.min(30, rows.length); i++) {
    console.log(i + ': ' + JSON.stringify(rows[i]));
  }
});
