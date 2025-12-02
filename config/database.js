const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Errore connessione database:', err);
  } else {
    console.log('Connesso al database SQLite');
  }
});

module.exports = db;
