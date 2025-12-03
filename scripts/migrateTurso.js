#!/usr/bin/env node
/**
 * Script di Migrazione Schema Database su Turso
 * 
 * Questo script crea tutte le tabelle necessarie su Turso.
 * Eseguilo DOPO aver configurato TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nel .env
 * 
 * Uso:
 *   node scripts/migrateTurso.js
 */

require('dotenv').config();
const { createClient } = require('@libsql/client');

// Verifica variabili ambiente
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('❌ ERRORE: Variabili TURSO_DATABASE_URL e TURSO_AUTH_TOKEN non configurate!');
  console.error('');
  console.error('Configura il file .env con:');
  console.error('  TURSO_DATABASE_URL=libsql://tuo-database.turso.io');
  console.error('  TURSO_AUTH_TOKEN=tuo_token_qui');
  console.error('');
  console.error('Vedi docs/SETUP_TURSO.md per istruzioni.');
  process.exit(1);
}

console.log('🚀 Migrazione schema database su Turso...\n');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    console.log('📡 Connessione a Turso...');
    console.log('🔗 URL:', process.env.TURSO_DATABASE_URL);
    
    // 1. Tabella users
    console.log('\n📋 Creazione tabella users...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'rider',
        nome TEXT,
        cognome TEXT,
        codice_fiscale TEXT,
        first_login INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella users creata');
    
    // 2. Tabella daily_reports
    console.log('\n📋 Creazione tabella daily_reports...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        data_giorno DATE NOT NULL,
        targa_furgone TEXT NOT NULL,
        codice_rotta TEXT NOT NULL,
        km_partenza INTEGER NOT NULL,
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
        status TEXT DEFAULT 'partito' CHECK(status IN ('partito', 'completato')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabella daily_reports creata');
    
    // 3. Tabella activity_log
    console.log('\n📋 Creazione tabella activity_log...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        description TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabella activity_log creata');
    
    // 4. Crea admin di default (se non esiste)
    console.log('\n👤 Creazione utente admin...');
    const bcrypt = require('bcryptjs');
    const adminPassword = bcrypt.hashSync('admin123', 10);
    
    try {
      await client.execute({
        sql: `INSERT INTO users (username, password, role, nome, cognome) 
              VALUES (?, ?, ?, ?, ?)`,
        args: ['admin', adminPassword, 'admin', 'Admin', 'Sistema']
      });
      console.log('✅ Utente admin creato (username: admin, password: admin123)');
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        console.log('ℹ️  Utente admin già esistente');
      } else {
        throw err;
      }
    }
    
    // 5. Verifica tabelle create
    console.log('\n🔍 Verifica tabelle...');
    const tables = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    console.log('📊 Tabelle create:', tables.rows.map(r => r.name).join(', '));
    
    console.log('\n✅ ========================================');
    console.log('✅ MIGRAZIONE COMPLETATA CON SUCCESSO!');
    console.log('✅ ========================================\n');
    console.log('🎉 Il database Turso è pronto per l\'uso!');
    console.log('');
    console.log('📝 Credenziali admin di default:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la password admin dopo il primo login!');
    console.log('');
    console.log('🚀 Prossimi passi:');
    console.log('   1. Configura le stesse variabili su Render (Dashboard > Environment)');
    console.log('   2. Fai deploy (git push)');
    console.log('   3. L\'app userà automaticamente Turso in produzione!');
    
  } catch (error) {
    console.error('\n❌ ERRORE durante la migrazione:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
