const db = require('../config/database');

console.log('🔄 Migrazione tabella daily_reports...\n');

async function migrate() {
  try {
    console.log('1. Creazione tabella temporanea...');
    await db.run(`
      CREATE TABLE daily_reports_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        data_giorno DATE NOT NULL,
        targa_furgone TEXT NOT NULL,
        codice_rotta TEXT,
        km_partenza INTEGER,
        km_rientro INTEGER,
        orario_rientro TIME,
        numero_scheda_dkv TEXT,
        importo_rifornimento REAL,
        numero_aziendale TEXT,
        pacchi_resi INTEGER,
        firma BOOLEAN DEFAULT 0,
        foto_posteriore TEXT,
        foto_anteriore TEXT,
        foto_lato_destro TEXT,
        foto_lato_sinistro TEXT,
        foto_interno TEXT,
        status TEXT DEFAULT 'in_preparazione' CHECK(status IN ('in_preparazione', 'partito', 'completato')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabella temporanea creata\n');

    console.log('2. Copia dati dalla vecchia tabella...');
    await db.run(`
      INSERT INTO daily_reports_new 
      SELECT * FROM daily_reports
    `);
    console.log('✅ Dati copiati\n');

    console.log('3. Eliminazione vecchia tabella...');
    await db.run('DROP TABLE daily_reports');
    console.log('✅ Vecchia tabella eliminata\n');

    console.log('4. Rinomina nuova tabella...');
    await db.run('ALTER TABLE daily_reports_new RENAME TO daily_reports');
    console.log('✅ Tabella rinominata\n');

    console.log('✅ MIGRAZIONE COMPLETATA!\n');
    console.log('Modifiche applicate:');
    console.log('- codice_rotta: ora può essere NULL');
    console.log('- km_partenza: ora può essere NULL');
    console.log('- status: aggiunto valore "in_preparazione" (default)');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Errore durante la migrazione:', err);
    process.exit(1);
  }
}

migrate();
