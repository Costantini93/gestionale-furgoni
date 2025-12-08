const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log('🚀 Avvio migrazione: add_rifornimento_fields');
    
    // Check if metodo_rifornimento column already exists
    try {
      console.log('📝 Aggiunta colonna metodo_rifornimento...');
      await client.execute(`
        ALTER TABLE daily_reports 
        ADD COLUMN metodo_rifornimento TEXT
      `);
      console.log('✅ Colonna metodo_rifornimento aggiunta');
    } catch (error) {
      if (error.message.includes('duplicate column')) {
        console.log('⚠️ Colonna metodo_rifornimento già esistente, skip');
      } else {
        throw error;
      }
    }
    
    // Check if importo_rifornimento column already exists
    try {
      console.log('📝 Aggiunta colonna importo_rifornimento...');
      await client.execute(`
        ALTER TABLE daily_reports 
        ADD COLUMN importo_rifornimento REAL
      `);
      console.log('✅ Colonna importo_rifornimento aggiunta');
    } catch (error) {
      if (error.message.includes('duplicate column')) {
        console.log('⚠️ Colonna importo_rifornimento già esistente, skip');
      } else {
        throw error;
      }
    }
    
    // Check if pacchi_resi column already exists
    try {
      console.log('📝 Aggiunta colonna pacchi_resi...');
      await client.execute(`
        ALTER TABLE daily_reports 
        ADD COLUMN pacchi_resi INTEGER DEFAULT 0
      `);
      console.log('✅ Colonna pacchi_resi aggiunta');
    } catch (error) {
      if (error.message.includes('duplicate column')) {
        console.log('⚠️ Colonna pacchi_resi già esistente, skip');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Migrazione completata con successo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
}

migrate();
