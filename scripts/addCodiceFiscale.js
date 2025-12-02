const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log('Aggiunta colonna codice_fiscale alla tabella users...');

try {
  db.exec('ALTER TABLE users ADD COLUMN codice_fiscale TEXT');
  console.log('✓ Colonna codice_fiscale aggiunta con successo!');
} catch (err) {
  if (err.message.includes('duplicate')) {
    console.log('✓ Colonna codice_fiscale già presente');
  } else {
    console.error('Errore:', err.message);
  }
}

db.close();
