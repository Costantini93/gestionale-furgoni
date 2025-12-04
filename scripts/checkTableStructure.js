const db = require('../config/database');

console.log('Controllo struttura tabella daily_reports...\n');

db.all('PRAGMA table_info(daily_reports)', [], (err, rows) => {
  if (err) {
    console.error('Errore:', err);
    process.exit(1);
  }
  
  console.log('Colonne della tabella daily_reports:\n');
  rows.forEach(col => {
    console.log(`${col.name}:`);
    console.log(`  - Tipo: ${col.type}`);
    console.log(`  - NOT NULL: ${col.notnull === 1 ? 'SI' : 'NO'}`);
    console.log(`  - Default: ${col.dflt_value || 'nessuno'}`);
    console.log('');
  });
  
  process.exit(0);
});
