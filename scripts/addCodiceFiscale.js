const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Aggiunta colonna codice_fiscale alla tabella users...');

db.run('ALTER TABLE users ADD COLUMN codice_fiscale TEXT', (err) => {
  if (err) {
    if (err.message.includes('duplicate')) {
      console.log('✓ Colonna codice_fiscale già presente');
    } else {
      console.error('Errore:', err.message);
    }
  } else {
    console.log('✓ Colonna codice_fiscale aggiunta con successo!');
  }
  db.close();
});
