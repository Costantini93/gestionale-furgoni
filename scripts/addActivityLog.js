const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Creazione tabella log attività...');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('✗ Errore creazione tabella activity_log:', err.message);
    } else {
      console.log('✓ Tabella activity_log creata con successo');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Errore chiudendo il database:', err.message);
  } else {
    console.log('\n✅ Sistema di log attività configurato!');
  }
});
