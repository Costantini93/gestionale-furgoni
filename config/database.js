const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// PERSISTENZA DATI SU RENDER
// Se esiste /opt/render/project/src/data (disco Render), usa quello
// Altrimenti usa directory locale (sviluppo)
let dbDir;
const renderDataPath = '/opt/render/project/src/data';

if (fs.existsSync(renderDataPath)) {
  // Ambiente Render con disco persistente
  dbDir = renderDataPath;
  console.log('🔵 RENDER: Uso disco persistente:', renderDataPath);
} else {
  // Sviluppo locale
  dbDir = path.join(__dirname, '..');
  console.log('💻 LOCAL: Uso directory progetto');
}

const dbPath = path.join(dbDir, 'database.db');
console.log('📂 Database path:', dbPath);

// Create database connection with better-sqlite3
const db = new Database(dbPath, { verbose: console.log });

console.log('✅ Connesso al database SQLite');

// Wrapper per compatibilità con sqlite3 API
const dbWrapper = {
  run: function(sql, params, callback) {
    try {
      // Se params è una funzione, è il callback (nessun parametro)
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const stmt = db.prepare(sql);
      // Filtra undefined e converti params in array
      const cleanParams = Array.isArray(params) 
        ? params.map(p => p === undefined ? null : p)
        : (params !== undefined ? [params] : []);
      const result = stmt.run(...cleanParams);
      if (callback) callback(null, result);
      return result;
    } catch (err) {
      if (callback) callback(err);
      else throw err;
    }
  },
  
  get: function(sql, params, callback) {
    try {
      // Se params è una funzione, è il callback (nessun parametro)
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const stmt = db.prepare(sql);
      // Filtra undefined e converti params in array
      const cleanParams = Array.isArray(params) 
        ? params.map(p => p === undefined ? null : p)
        : (params !== undefined ? [params] : []);
      const result = stmt.get(...cleanParams);
      if (callback) callback(null, result);
      return result;
    } catch (err) {
      if (callback) callback(err);
      else throw err;
    }
  },
  
  all: function(sql, params, callback) {
    try {
      // Se params è una funzione, è il callback (nessun parametro)
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      
      const stmt = db.prepare(sql);
      // Filtra undefined e converti params in array
      const cleanParams = Array.isArray(params) 
        ? params.map(p => p === undefined ? null : p)
        : (params !== undefined ? [params] : []);
      const result = stmt.all(...cleanParams);
      if (callback) callback(null, result);
      return result;
    } catch (err) {
      if (callback) callback(err);
      else throw err;
    }
  },
  
  exec: function(sql) {
    return db.exec(sql);
  }
};

module.exports = dbWrapper;
