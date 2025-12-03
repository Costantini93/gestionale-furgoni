require('dotenv').config();
const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createRosterTable() {
  try {
    console.log('🔧 Creazione tabella roster_daily...');

    // Crea tabella per tracciare i driver in turno per ogni giorno
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS roster_daily (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL,
        roster_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(driver_id, roster_date)
      )
    `);

    console.log('✅ Tabella roster_daily creata!');
    console.log('\n🎉 Setup completato!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

createRosterTable();
