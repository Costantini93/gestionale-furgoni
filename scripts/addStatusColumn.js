const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

console.log('Aggiunta colonna status alla tabella daily_reports...');

try {
  // Verifica se la colonna esiste già
  const tableInfo = db.prepare("PRAGMA table_info(daily_reports)").all();
  const hasStatus = tableInfo.some(col => col.name === 'status');
  
  if (!hasStatus) {
    // Aggiungi colonna status
    db.exec(`
      ALTER TABLE daily_reports 
      ADD COLUMN status TEXT DEFAULT 'partito' 
      CHECK(status IN ('partito', 'completato'))
    `);
    console.log('✓ Colonna status aggiunta con successo');
    
    // Aggiorna i report esistenti a 'completato' (hanno già km_rientro)
    const updateStmt = db.prepare(`
      UPDATE daily_reports 
      SET status = 'completato' 
      WHERE km_rientro IS NOT NULL AND km_rientro > 0
    `);
    const result = updateStmt.run();
    console.log(`✓ ${result.changes} report esistenti aggiornati a 'completato'`);
  } else {
    console.log('⚠️ Colonna status già esistente, skip');
  }
  
  // Modifica le colonne km_rientro e orario_rientro per permettere NULL
  console.log('\nModifica colonne per permettere valori NULL alla partenza...');
  
  // SQLite non supporta ALTER COLUMN, dobbiamo ricreare la tabella
  db.exec(`
    -- Crea tabella temporanea con la nuova struttura
    CREATE TABLE daily_reports_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      data_giorno DATE NOT NULL,
      targa_furgone TEXT NOT NULL,
      codice_rotta TEXT NOT NULL,
      km_partenza INTEGER NOT NULL,
      km_rientro INTEGER,
      orario_rientro TIME,
      numero_scheda_dkv TEXT,
      importo_rifornimento DECIMAL(10,2),
      numero_aziendale TEXT,
      pacchi_resi INTEGER,
      firma INTEGER DEFAULT 0,
      status TEXT DEFAULT 'partito' CHECK(status IN ('partito', 'completato')),
      foto_posteriore TEXT,
      foto_anteriore TEXT,
      foto_lato_destro TEXT,
      foto_lato_sinistro TEXT,
      foto_interno TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    -- Copia i dati dalla vecchia tabella
    INSERT INTO daily_reports_new 
    SELECT 
      id, user_id, data_giorno, targa_furgone, codice_rotta, 
      km_partenza, km_rientro, orario_rientro, numero_scheda_dkv, 
      importo_rifornimento, numero_aziendale, pacchi_resi, firma,
      COALESCE(status, 'completato') as status,
      foto_posteriore, foto_anteriore, foto_lato_destro, 
      foto_lato_sinistro, foto_interno, created_at
    FROM daily_reports;
    
    -- Elimina la vecchia tabella
    DROP TABLE daily_reports;
    
    -- Rinomina la nuova tabella
    ALTER TABLE daily_reports_new RENAME TO daily_reports;
  `);
  
  console.log('✓ Tabella daily_reports aggiornata con successo');
  console.log('✓ Colonne km_rientro e orario_rientro ora permettono NULL');
  console.log('✓ Vincolo UNIQUE rimosso per permettere più report per giorno (partenza + rientro separati)');
  
  console.log('\n=================================');
  console.log('Migrazione completata con successo!');
  console.log('=================================\n');
  
  db.close();
} catch (error) {
  console.error('❌ Errore durante la migrazione:', error);
  db.close();
  process.exit(1);
}
