const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log('🔄 Aggiunta campo orario_partenza alla tabella daily_reports...');
    
    try {
      await client.execute('ALTER TABLE daily_reports ADD COLUMN orario_partenza TEXT');
      console.log('✅ Colonna orario_partenza aggiunta con successo');
    } catch (error) {
      if (error.message.includes('duplicate column')) {
        console.log('⚠️ Colonna orario_partenza già esistente, skip');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Migrazione completata!');
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
}

migrate();
