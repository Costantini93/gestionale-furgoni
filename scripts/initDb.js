const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

async function initDatabase() {
  console.log('Inizializzazione database...');

  try {
    // Tabella utenti
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nome TEXT NOT NULL,
        cognome TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'rider')),
        first_login INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabella users creata');

    // Tabella report giornalieri
    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        data_giorno DATE NOT NULL,
        targa_furgone TEXT NOT NULL,
        codice_rotta TEXT NOT NULL,
        km_partenza INTEGER NOT NULL,
        km_rientro INTEGER NOT NULL,
        orario_rientro TIME NOT NULL,
        numero_scheda_dkv TEXT,
        importo_rifornimento DECIMAL(10,2),
        numero_aziendale TEXT,
        pacchi_resi INTEGER,
        firma INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, data_giorno)
      )
    `);
    console.log('✓ Tabella daily_reports creata');

    // Password hash per tutti gli utenti (admin123)
    const defaultPassword = await bcrypt.hash('admin123', 10);

    // Inserisci utente admin
    const insertAdmin = db.prepare(`
      INSERT OR IGNORE INTO users (username, password, nome, cognome, role, first_login) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run('admin', defaultPassword, 'Admin', 'Sistema', 'admin', 0);
    console.log('✓ Utente admin creato (username: admin, password: admin123)');

    console.log('\n=================================');
    console.log('Database inizializzato con successo!');
    console.log('=================================');
    console.log('\nCredenziali di accesso:');
    console.log('ADMIN:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('=================================\n');
    
    db.close();
  } catch (error) {
    console.error('Errore durante l\'inizializzazione:', error);
    db.close();
    process.exit(1);
  }
}

initDatabase();
