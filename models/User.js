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

  // Ottieni utenti per role
  getByRole: (role, callback) => {
    db.all('SELECT id, username, nome, cognome, codice_fiscale, created_at FROM users WHERE role = ? ORDER BY cognome, nome', [role], callback);
  },

  // Aggiorna password
  updatePassword: (userId, hashedPassword, callback) => {
    db.run('UPDATE users SET password = ?, first_login = 0 WHERE id = ?', 
      [hashedPassword, userId], callback);
  },

  // Crea nuovo utente
  create: (userData, callback) => {
    const { username, password, nome, cognome, codice_fiscale, role, fixed_vehicle_id, is_active } = userData;
    db.run(
      'INSERT INTO users (username, password, nome, cognome, codice_fiscale, role, fixed_vehicle_id, is_active, first_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [username, password, nome, cognome, codice_fiscale, role, fixed_vehicle_id || null, is_active !== undefined ? is_active : 1],
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
