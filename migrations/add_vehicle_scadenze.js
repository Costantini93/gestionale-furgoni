const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log('🔄 Aggiunta campi scadenze alla tabella vehicles...');
    
    const fieldsToAdd = [
      { name: 'ultimo_tagliando_km', type: 'INTEGER' },
      { name: 'ultimo_tagliando_data', type: 'TEXT' },
      { name: 'prossimo_tagliando_km', type: 'INTEGER' },
      { name: 'km_attuali', type: 'INTEGER DEFAULT 0' },
      { name: 'data_scadenza_contratto', type: 'TEXT' },
      { name: 'data_scadenza_assicurazione', type: 'TEXT' },
      { name: 'data_scadenza_revisione', type: 'TEXT' },
      { name: 'note_manutenzione', type: 'TEXT' }
    ];
    
    for (const field of fieldsToAdd) {
      try {
        await client.execute(`ALTER TABLE vehicles ADD COLUMN ${field.name} ${field.type}`);
        console.log(`✅ Colonna ${field.name} aggiunta`);
      } catch (error) {
        if (error.message.includes('duplicate column')) {
          console.log(`⚠️  Colonna ${field.name} già esistente, skip`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migrazione completata!');
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
}

migrate();
