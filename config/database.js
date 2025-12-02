const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');

// Create database connection with better-sqlite3
const db = new Database(dbPath, { verbose: console.log });

console.log('Connesso al database SQLite');

// Wrapper per compatibilità con sqlite3 API
const dbWrapper = {
  run: function(sql, params, callback) {
    try {
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
      throw err;
    }
  },
  
  get: function(sql, params, callback) {
    try {
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
      throw err;
    }
  },
  
  all: function(sql, params, callback) {
    try {
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
      throw err;
    }
  },
  
  exec: function(sql) {
    return db.exec(sql);
  }
};

module.exports = dbWrapper;
