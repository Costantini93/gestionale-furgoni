const db = require('./config/database');

// Aggiungi colonna orario_partenza_effettivo alla tabella daily_reports
db.run(`
  ALTER TABLE daily_reports 
  ADD COLUMN orario_partenza_effettivo TEXT
`, (err) => {
  if (err) {
    console.error('❌ Errore (potrebbe già esistere):', err.message);
  } else {
    console.log('✅ Colonna orario_partenza_effettivo aggiunta con successo!');
  }
  
  // Verifica struttura
  db.all(`PRAGMA table_info(daily_reports)`, (err, columns) => {
    if (err) {
      console.error('Errore:', err);
    } else {
      console.log('\n📋 Struttura tabella daily_reports:');
      columns.forEach(col => {
        console.log(`   ${col.name} (${col.type})`);
      });
    }
    process.exit(0);
  });
});
