const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Aggiunta colonne per le foto dei furgoni...');

db.serialize(() => {
  // Aggiungi le 5 colonne per le foto
  const columns = [
    'foto_posteriore',
    'foto_anteriore',
    'foto_lato_destro',
    'foto_lato_sinistro',
    'foto_interno'
  ];

  columns.forEach(col => {
    db.run(`ALTER TABLE daily_reports ADD COLUMN ${col} TEXT`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`✓ Colonna ${col} già esistente`);
        } else {
          console.error(`✗ Errore aggiungendo ${col}:`, err.message);
        }
      } else {
        console.log(`✓ Colonna ${col} aggiunta con successo`);
      }
    });
  });
});

db.close((err) => {
  if (err) {
    console.error('Errore chiudendo il database:', err.message);
  } else {
    console.log('\n✅ Database aggiornato!');
  }
});
