const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log('Aggiunta colonne per le foto dei furgoni...');

const columns = [
  'foto_posteriore',
  'foto_anteriore',
  'foto_lato_destro',
  'foto_lato_sinistro',
  'foto_interno'
];

columns.forEach(col => {
  try {
    db.exec(`ALTER TABLE daily_reports ADD COLUMN ${col} TEXT`);
    console.log(`✓ Colonna ${col} aggiunta con successo`);
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log(`✓ Colonna ${col} già esistente`);
    } else {
      console.error(`✗ Errore aggiungendo ${col}:`, err.message);
    }
  }
});

console.log('\n✅ Database aggiornato!');
db.close();
