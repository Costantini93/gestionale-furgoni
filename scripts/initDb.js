const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

async function initDatabase() {
  console.log('Inizializzazione database...');

  db.serialize(async () => {
    // Tabella utenti
    db.run(`
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
    `, (err) => {
      if (err) console.error('Errore creazione tabella users:', err);
      else console.log('✓ Tabella users creata');
    });

    // Tabella report giornalieri
    db.run(`
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
    `, (err) => {
      if (err) console.error('Errore creazione tabella daily_reports:', err);
      else console.log('✓ Tabella daily_reports creata');
    });

    // Aspetta che le tabelle siano create
    setTimeout(async () => {
      try {
        // Password hash per tutti gli utenti (1234)
        const defaultPassword = await bcrypt.hash('1234', 10);

        // Inserisci utente admin
        db.run(
          `INSERT OR IGNORE INTO users (username, password, nome, cognome, role, first_login) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['admin', defaultPassword, 'Admin', 'Sistema', 'admin', 1],
          (err) => {
            if (err) console.error('Errore inserimento admin:', err);
            else console.log('✓ Utente admin creato (username: admin, password: 1234)');
          }
        );

        // Inserisci alcuni rider di esempio
        const riders = [
          { username: 'mario_rossi', nome: 'Mario', cognome: 'Rossi' },
          { username: 'luigi_verdi', nome: 'Luigi', cognome: 'Verdi' },
          { username: 'anna_bianchi', nome: 'Anna', cognome: 'Bianchi' }
        ];

        riders.forEach(rider => {
          db.run(
            `INSERT OR IGNORE INTO users (username, password, nome, cognome, role, first_login) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [rider.username, defaultPassword, rider.nome, rider.cognome, 'rider', 1],
            (err) => {
              if (err) console.error(`Errore inserimento ${rider.username}:`, err);
              else console.log(`✓ Rider ${rider.nome} ${rider.cognome} creato (username: ${rider.username}, password: 1234)`);
            }
          );
        });

        setTimeout(() => {
          console.log('\n=================================');
          console.log('Database inizializzato con successo!');
          console.log('=================================');
          console.log('\nCredenziali di accesso:');
          console.log('ADMIN:');
          console.log('  Username: admin');
          console.log('  Password: 1234');
          console.log('\nRIDER (esempi):');
          console.log('  Username: mario_rossi | Password: 1234');
          console.log('  Username: luigi_verdi | Password: 1234');
          console.log('  Username: anna_bianchi | Password: 1234');
          console.log('\nAl primo accesso verrà richiesto il cambio password.');
          console.log('=================================\n');
          
          db.close();
        }, 1000);
      } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
        db.close();
      }
    }, 500);
  });
}

initDatabase();
