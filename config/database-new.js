const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let db;
let isTurso = false;

// Determina quale database usare
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // ===== TURSO (CLOUD) =====
  console.log('☁️  TURSO: Connesso a database cloud');
  console.log('📂 Database URL:', process.env.TURSO_DATABASE_URL);
  
  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  isTurso = true;
  db = tursoClient;
  
} else {
  // ===== SQLITE LOCALE (SVILUPPO) =====
  const dbDir = path.join(__dirname, '..');
  const dbPath = path.join(dbDir, 'database.db');
  console.log('💻 LOCAL: Uso database locale');
  console.log('📂 Database path:', dbPath);
  
  db = new Database(dbPath, { verbose: console.log });
}

console.log('✅ Connesso al database');

// Wrapper unificato per compatibilità con entrambi i DB
const dbWrapper = {
  run: async function(sql, params, callback) {
    try {
      // Normalizza params
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const cleanParams = Array.isArray(params) 
        ? params.map(p => p === undefined ? null : p)
        : (params !== undefined ? [params] : []);
      
      let result;
      
      if (isTurso) {
        // Turso (async)
        result = await db.execute({ sql, args: cleanParams });
      } else {
        // SQLite locale (sync)
        const stmt = db.prepare(sql);
        result = stmt.run(...cleanParams);
      }
      
      if (callback) callback(null, result);
      return result;
    } catch (err) {
      console.error('❌ DB Error (run):', err.message);
      if (callback) callback(err);
      else throw err;
    }
  },
  
  get: async function(sql, params, callback) {
    try {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const cleanParams = Array.isArray(params) 
        ? params.map(p => p === undefined ? null : p)
        : (params !== undefined ? [params] : []);
      
      let result;
      
      if (isTurso) {
        // Turso (async)
        const response = await db.execute({ sql, args: cleanParams });
        result = response.rows[0] || null;
      } else {
        // SQLite locale (sync)
        const stmt = db.prepare(sql);
        result = stmt.get(...cleanParams);
      }
      
      if (callback) callback(null, result);
      return result;
    } catch (err) {
      console.error('❌ DB Error (get):', err.message);
      if (callback) callback(err);
      else throw err;
    }
  },
  
  all: async function(sql, params, callback) {
    try {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const cleanParams = Array.isArray(params) 
        ? params.map(p => p === undefined ? null : p)
        : (params !== undefined ? [params] : []);
      
      let result;
      
      if (isTurso) {
        // Turso (async)
        const response = await db.execute({ sql, args: cleanParams });
        result = response.rows || [];
      } else {
        // SQLite locale (sync)
        const stmt = db.prepare(sql);
        result = stmt.all(...cleanParams);
      }
      
      if (callback) callback(null, result);
      return result;
    } catch (err) {
      console.error('❌ DB Error (all):', err.message);
      if (callback) callback(err);
      else throw err;
    }
  },
  
  exec: async function(sql) {
    try {
      if (isTurso) {
        // Turso: split multiple statements
        const statements = sql.split(';').filter(s => s.trim());
        for (const stmt of statements) {
          if (stmt.trim()) {
            await db.execute(stmt.trim());
          }
        }
      } else {
        // SQLite locale
        db.exec(sql);
      }
    } catch (err) {
      console.error('❌ DB Error (exec):', err.message);
      throw err;
    }
  },
  
  // Info su tipo database
  isTurso: () => isTurso,
  isLocal: () => !isTurso
};

module.exports = dbWrapper;
