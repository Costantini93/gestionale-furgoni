const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log('🔄 Aggiunta campi scadenze alla tabella vehicles...');
    
    const columns = [
      { name: 'km_tagliando_prossimo', type: 'INTEGER', description: 'Km per prossimo tagliando' },
      { name: 'data_scadenza_contratto', type: 'TEXT', description: 'Data scadenza contratto' },
      { name: 'km_attuali', type: 'INTEGER DEFAULT 0', description: 'Km attuali del veicolo' },
      { name: 'soglia_alert_km', type: 'INTEGER DEFAULT 1000', description: 'Alert quando mancano X km al tagliando' },
      { name: 'tipo_contratto', type: 'TEXT', description: 'Tipo di contratto (Noleggio/Proprietà/Leasing)' },
      { name: 'note_scadenze', type: 'TEXT', description: 'Note su scadenze e manutenzioni' }
    ];
    
    for (const col of columns) {
      try {
        await client.execute(`ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Colonna ${col.name} aggiunta: ${col.description}`);
      } catch (error) {
        if (error.message.includes('duplicate column')) {
          console.log(`⚠️ Colonna ${col.name} già esistente, skip`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migrazione scadenze completata!');
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
}

migrate();
