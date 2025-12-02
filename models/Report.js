const db = require('../config/database');

const ReportModel = {
  // Crea nuovo report giornaliero
  create: (reportData, callback) => {
    const {
      user_id,
      data_giorno,
      targa_furgone,
      codice_rotta,
      km_partenza,
      km_rientro,
      orario_rientro,
      numero_scheda_dkv,
      importo_rifornimento,
      numero_aziendale,
      pacchi_resi,
      firma,
      foto_posteriore,
      foto_anteriore,
      foto_lato_destro,
      foto_lato_sinistro,
      foto_interno
    } = reportData;

    db.run(
      `INSERT INTO daily_reports (
        user_id, data_giorno, targa_furgone, codice_rotta, 
        km_partenza, km_rientro, orario_rientro, numero_scheda_dkv,
        importo_rifornimento, numero_aziendale, pacchi_resi, firma,
        foto_posteriore, foto_anteriore, foto_lato_destro, 
        foto_lato_sinistro, foto_interno
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, data_giorno, targa_furgone, codice_rotta,
        km_partenza, km_rientro, orario_rientro, numero_scheda_dkv,
        importo_rifornimento, numero_aziendale, pacchi_resi, firma,
        foto_posteriore, foto_anteriore, foto_lato_destro,
        foto_lato_sinistro, foto_interno
      ],
      callback
    );
  },

  // Ottieni tutti i report
  getAll: (callback) => {
    db.all(
      `SELECT r.*, u.username, u.nome, u.cognome 
       FROM daily_reports r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.data_giorno DESC, r.created_at DESC`,
      callback
    );
  },

  // Ottieni report per singolo utente
  getByUserId: (userId, callback) => {
    db.all(
      `SELECT r.*, u.username, u.nome, u.cognome 
       FROM daily_reports r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.user_id = ? 
       ORDER BY r.data_giorno DESC, r.created_at DESC`,
      [userId],
      callback
    );
  },

  // Ottieni report per data
  getByDate: (date, callback) => {
    db.all(
      `SELECT r.*, u.username, u.nome, u.cognome 
       FROM daily_reports r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.data_giorno = ? 
       ORDER BY u.cognome, u.nome`,
      [date],
      callback
    );
  },

  // Verifica se esiste già un report per un utente in una data
  checkExisting: (userId, date, callback) => {
    db.get(
      'SELECT id FROM daily_reports WHERE user_id = ? AND data_giorno = ?',
      [userId, date],
      callback
    );
  },

  // Aggiorna report (solo admin)
  update: (reportId, reportData, callback) => {
    const {
      targa_furgone,
      codice_rotta,
      km_partenza,
      km_rientro,
      orario_rientro,
      numero_scheda_dkv,
      importo_rifornimento,
      numero_aziendale,
      pacchi_resi
    } = reportData;

    db.run(
      `UPDATE daily_reports SET 
        targa_furgone = ?, codice_rotta = ?, km_partenza = ?, 
        km_rientro = ?, orario_rientro = ?, numero_scheda_dkv = ?,
        importo_rifornimento = ?, numero_aziendale = ?, pacchi_resi = ?
       WHERE id = ?`,
      [
        targa_furgone, codice_rotta, km_partenza,
        km_rientro, orario_rientro, numero_scheda_dkv,
        importo_rifornimento, numero_aziendale, pacchi_resi, reportId
      ],
      callback
    );
  },

  // Elimina report (solo admin)
  delete: (reportId, callback) => {
    db.run('DELETE FROM daily_reports WHERE id = ?', [reportId], callback);
  }
};

module.exports = ReportModel;
