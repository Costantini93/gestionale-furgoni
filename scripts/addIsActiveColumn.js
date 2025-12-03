require('dotenv').config();
const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addIsActiveColumn() {
  try {
    console.log('🔧 Aggiunta colonna is_active alla tabella users...');

    // Verifica se la colonna esiste già
    const tableInfo = await turso.execute('PRAGMA table_info(users)');
    const columnExists = tableInfo.rows.some(row => row.name === 'is_active');

    if (columnExists) {
      console.log('✅ La colonna is_active esiste già!');
    } else {
      // Aggiungi la colonna is_active (default = 1, quindi tutti attivi)
      await turso.execute('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
      console.log('✅ Colonna is_active aggiunta con successo!');
    }

    // Verifica che tutti gli utenti esistenti abbiano is_active = 1
    await turso.execute('UPDATE users SET is_active = 1 WHERE is_active IS NULL');
    console.log('✅ Tutti gli utenti esistenti impostati come attivi!');

    console.log('\n🎉 Migrazione completata!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
}

addIsActiveColumn();
