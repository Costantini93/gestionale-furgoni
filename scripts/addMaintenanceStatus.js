const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addMaintenanceStatus() {
  try {
    console.log('🔧 Aggiunta colonna in_manutenzione alla tabella vehicles...');
    
    await db.execute(`
      ALTER TABLE vehicles ADD COLUMN in_manutenzione INTEGER DEFAULT 0
    `);
    
    console.log('✅ Colonna in_manutenzione aggiunta con successo!');
    console.log('📝 0 = Furgone disponibile, 1 = Furgone in manutenzione');
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️  La colonna in_manutenzione esiste già');
    } else {
      console.error('❌ Errore:', error.message);
      throw error;
    }
  } finally {
    process.exit(0);
  }
}

addMaintenanceStatus();
