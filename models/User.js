const db = require('../config/database');

const UserModel = {
  // Trova utente per username
  findByUsername: (username, callback) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], callback);
  },

  // Trova utente per ID
  findById: (id, callback) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], callback);
  },

  // Ottieni tutti gli utenti (solo rider)
  getAllRiders: (callback) => {
    db.all('SELECT id, username, nome, cognome, codice_fiscale, created_at FROM users WHERE role = ?', ['rider'], callback);
  },

  // Aggiorna password
  updatePassword: (userId, hashedPassword, callback) => {
    db.run('UPDATE users SET password = ?, first_login = 0 WHERE id = ?', 
      [hashedPassword, userId], callback);
  },

  // Crea nuovo utente
  create: (userData, callback) => {
    const { username, password, nome, cognome, codice_fiscale, role } = userData;
    db.run(
      'INSERT INTO users (username, password, nome, cognome, codice_fiscale, role, first_login) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [username, password, nome, cognome, codice_fiscale, role],
      callback
    );
  },

  // Trova username simili (per gestire duplicati)
  findSimilarUsernames: (baseUsername, callback) => {
    db.all(
      'SELECT username FROM users WHERE username LIKE ?',
      [baseUsername + '%'],
      callback
    );
  },

  // Trova per codice fiscale
  findByCodiceFiscale: (codiceFiscale, callback) => {
    db.get('SELECT * FROM users WHERE codice_fiscale = ?', [codiceFiscale], callback);
  }
};

module.exports = UserModel;
