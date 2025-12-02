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
      const result = stmt.run(...(Array.isArray(params) ? params : [params].filter(Boolean)));
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
      const result = stmt.get(...(Array.isArray(params) ? params : [params].filter(Boolean)));
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
      const result = stmt.all(...(Array.isArray(params) ? params : [params].filter(Boolean)));
      if (callback) callback(null, result);
      return result;
    } catch (err) {
      if (callback) callback(err);
      throw err;
    }
  }
};

module.exports = dbWrapper;
