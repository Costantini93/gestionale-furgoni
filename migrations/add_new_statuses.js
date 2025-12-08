const db = require('../config/database');

console.log('🔄 Migrazione: Aggiunta nuovi status per sostituzioni...');

async function migrate() {
  try {
    console.log('📋 Step 1: Creazione tabella temporanea...');
    await db.run(`
      CREATE TABLE daily_reports_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        data_giorno DATE NOT NULL,
        targa_furgone TEXT NOT NULL,
        codice_rotta TEXT,
        km_partenza INTEGER,
        km_rientro INTEGER,
        orario_rientro TEXT,
        orario_partenza_effettivo DATETIME,
        numero_scheda_dkv TEXT,
        importo_rifornimento REAL,
        numero_aziendale TEXT,
        pacchi_resi INTEGER,
        firma TEXT,
        foto_posteriore TEXT,
        foto_anteriore TEXT,
        foto_lato_destro TEXT,
        foto_lato_sinistro TEXT,
        foto_interno TEXT,
        status TEXT CHECK(status IN ('in_preparazione', 'partito', 'completato', 'interrotto', 'sostituzione_partenza')) DEFAULT 'in_preparazione',
        original_report_id INTEGER,
        is_substitution INTEGER DEFAULT 0,
        substitution_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabella temporanea creata');

    console.log('📋 Step 2: Copia dati...');
    await db.run(`
      INSERT INTO daily_reports_new (
        id, user_id, data_giorno, targa_furgone, codice_rotta,
        km_partenza, km_rientro, orario_rientro, orario_partenza_effettivo,
        numero_scheda_dkv, importo_rifornimento, numero_aziendale, pacchi_resi,
        firma, foto_posteriore, foto_anteriore, foto_lato_destro, 
        foto_lato_sinistro, foto_interno, status,
        original_report_id, is_substitution, substitution_reason, created_at
      )
      SELECT 
        id, user_id, data_giorno, targa_furgone, codice_rotta,
        km_partenza, km_rientro, orario_rientro, orario_partenza_effettivo,
        numero_scheda_dkv, importo_rifornimento, numero_aziendale, pacchi_resi,
        firma, foto_posteriore, foto_anteriore, foto_lato_destro, 
        foto_lato_sinistro, foto_interno, status,
        original_report_id, is_substitution, substitution_reason, created_at
      FROM daily_reports
    `);
    console.log('✅ Dati copiati');

    console.log('📋 Step 3: Elimina tabella vecchia...');
    await db.run(`DROP TABLE daily_reports`);
    console.log('✅ Tabella vecchia eliminata');

    console.log('📋 Step 4: Rinomina tabella...');
    await db.run(`ALTER TABLE daily_reports_new RENAME TO daily_reports`);
    console.log('✅ Tabella rinominata');

    console.log('🎉 Migrazione completata con successo!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Errore durante migrazione:', err);
    process.exit(1);
  }
}

migrate();

