const db = require('./config/database');

db.all(`PRAGMA table_info(daily_reports)`, (err, columns) => {
  if (err) {
    console.error('Errore:', err);
    process.exit(1);
  }
  
  console.log('Colonne della tabella daily_reports:');
  columns.forEach(col => console.log(`  - ${col.name} (${col.type})`));
  process.exit(0);
});
