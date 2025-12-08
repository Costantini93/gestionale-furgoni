require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function migrate() {
  try {
    console.log('🔧 Inizio migrazione: aggiunta campi per sostituzioni furgoni...');

    // Aggiungi colonna original_report_id
    await db.execute(`
      ALTER TABLE daily_reports 
      ADD COLUMN original_report_id INTEGER
    `);
    console.log('✅ Colonna original_report_id aggiunta');

    // Aggiungi colonna is_substitution
    await db.execute(`
      ALTER TABLE daily_reports 
      ADD COLUMN is_substitution INTEGER DEFAULT 0
    `);
    console.log('✅ Colonna is_substitution aggiunta');

    // Aggiungi colonna substitution_reason
    await db.execute(`
      ALTER TABLE daily_reports 
      ADD COLUMN substitution_reason TEXT
    `);
    console.log('✅ Colonna substitution_reason aggiunta');

    console.log('\n✅ Migrazione completata con successo!');
    console.log('\nCampi aggiunti:');
    console.log('- original_report_id: Link al report originale sostituito');
    console.log('- is_substitution: Flag per identificare report di sostituzione (0=no, 1=si)');
    console.log('- substitution_reason: Motivo della sostituzione (es: guasto motore)');

  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
