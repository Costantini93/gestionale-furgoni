const db = require('../config/database');

console.log('🔧 Migrazione: Aggiungi campi pacchi_ritornati e rifornimento_euro...');

// Aggiungi colonne alla tabella reports
const migrations = [
  `ALTER TABLE reports ADD COLUMN pacchi_ritornati INTEGER DEFAULT 0`,
  `ALTER TABLE reports ADD COLUMN rifornimento_euro DECIMAL(10,2) DEFAULT 0`
];

let completed = 0;
migrations.forEach((sql, index) => {
  db.run(sql, [], (err) => {
    completed++;
    if (err) {
      console.log(`⚠️  Colonna ${index + 1} già esistente o errore:`, err.message);
    } else {
      console.log(`✅ Colonna ${index + 1} aggiunta con successo`);
    }
    
    if (completed === migrations.length) {
      console.log('\n✅ Migrazione completata!');
      process.exit(0);
    }
  });
});
