const db = require('../config/database');

class Vehicle {
  static getAll(callback) {
    db.all('SELECT * FROM vehicles ORDER BY targa', [], callback);
  }

  static getAllWithAssignments(callback) {
    db.all(
      `SELECT 
        v.*,
        va.id as assignment_id,
        va.data_assegnazione,
        va.note as assignment_note,
        u.id as rider_id,
        u.nome as rider_nome,
        u.cognome as rider_cognome
       FROM vehicles v
       LEFT JOIN vehicle_assignments va ON v.id = va.vehicle_id AND va.status = 'attivo'
       LEFT JOIN users u ON va.rider_id = u.id
       ORDER BY v.targa`,
      [],
      (err, rows) => {
        if (err) return callback(err);
        
        // Trasforma i dati per includere current_assignment
        const vehicles = rows.map(row => ({
          id: row.id,
          license_plate: row.targa,
          model: row.modello,
          anno: row.anno,
          status: row.status,
          current_assignment: row.assignment_id ? {
            id: row.assignment_id,
            data_assegnazione: row.data_assegnazione,
            note: row.assignment_note,
            rider_nome: row.rider_nome,
            rider_cognome: row.rider_cognome
          } : null
        }));
        
        callback(null, vehicles);
      }
    );
  }

  static getAvailable(callback) {
    db.all('SELECT * FROM vehicles WHERE status = ? AND (in_manutenzione = 0 OR in_manutenzione IS NULL) ORDER BY targa', ['disponibile'], callback);
  }

  static getById(id, callback) {
    db.get('SELECT * FROM vehicles WHERE id = ?', [id], callback);
  }

  static create(data, callback) {
    const { targa, modello, anno, note, status } = data;
    db.run(
      'INSERT INTO vehicles (targa, modello, anno, note, status) VALUES (?, ?, ?, ?, ?)',
      [targa, modello, anno, note || null, status || 'disponibile'],
      callback
    );
  }

  static delete(id, callback) {
    db.run('DELETE FROM vehicles WHERE id = ?', [id], callback);
  }

  static updateStatus(id, status, callback) {
    db.run(
      'UPDATE vehicles SET status = ? WHERE id = ?',
      [status, id],
      callback
    );
  }
}

class Assignment {
  static create(data, callback) {
    const { rider_id, vehicle_id, data_assegnazione, note } = data;
    db.run(
      `INSERT INTO vehicle_assignments 
       (rider_id, vehicle_id, data_assegnazione, note) 
       VALUES (?, ?, ?, ?)`,
      [rider_id, vehicle_id, data_assegnazione, note],
      callback
    );
  }

  static getActive(callback) {
    db.all(
      `SELECT va.*, 
              u.nome || ' ' || u.cognome as rider_name,
              v.targa, v.modello
       FROM vehicle_assignments va
       JOIN users u ON va.rider_id = u.id
       JOIN vehicles v ON va.vehicle_id = v.id
       WHERE va.status = 'attivo'
       ORDER BY va.data_assegnazione DESC`,
      [],
      callback
    );
  }

  static getByRider(riderId, callback) {
    db.get(
      `SELECT va.*, v.targa, v.modello
       FROM vehicle_assignments va
       JOIN vehicles v ON va.vehicle_id = v.id
       WHERE va.rider_id = ? AND va.status = 'attivo'
       ORDER BY va.data_assegnazione DESC
       LIMIT 1`,
      [riderId],
      callback
    );
  }

  static complete(id, data_riconsegna, km_rientro, callback) {
    db.run(
      `UPDATE vehicle_assignments 
       SET data_riconsegna = ?, km_rientro = ?, status = 'completato'
       WHERE id = ?`,
      [data_riconsegna, km_rientro, id],
      callback
    );
  }

  static checkConflict(vehicleId, dataAssegnazione, callback) {
    db.get(
      `SELECT COUNT(*) as count
       FROM vehicle_assignments
       WHERE vehicle_id = ? 
       AND data_assegnazione = ?
       AND status = 'attivo'`,
      [vehicleId, dataAssegnazione],
      (err, result) => {
        if (err) return callback(err);
        callback(null, result.count > 0);
      }
    );
  }

  static endActiveAssignments(vehicleId, callback) {
    db.run(
      `UPDATE vehicle_assignments 
       SET status = 'completato', data_riconsegna = date('now')
       WHERE vehicle_id = ? AND status = 'attivo'`,
      [vehicleId],
      callback
    );
  }

  static getActiveByVehicleId(vehicleId, callback) {
    db.get(
      `SELECT * FROM vehicle_assignments 
       WHERE vehicle_id = ? AND status = 'attivo'
       LIMIT 1`,
      [vehicleId],
      callback
    );
  }
}

class Maintenance {
  static create(data, callback) {
    const { vehicle_id, reporter_id, issue_description, priority, photo_path } = data;
    db.run(
      `INSERT INTO maintenance_requests 
       (vehicle_id, reporter_id, issue_description, priority, photo_path) 
       VALUES (?, ?, ?, ?, ?)`,
      [vehicle_id, reporter_id, issue_description, priority, photo_path],
      callback
    );
  }

  static getAll(callback) {
    db.all(
      `SELECT mr.*,
              v.targa, v.modello,
              u.nome || ' ' || u.cognome as reporter_name
       FROM maintenance_requests mr
       JOIN vehicles v ON mr.vehicle_id = v.id
       JOIN users u ON mr.reporter_id = u.id
       ORDER BY 
         CASE mr.priority
           WHEN 'alta' THEN 1
           WHEN 'media' THEN 2
           WHEN 'bassa' THEN 3
         END,
         mr.created_at DESC`,
      [],
      callback
    );
  }

  static getPending(callback) {
    db.all(
      `SELECT mr.*,
              v.targa, v.modello,
              u.nome || ' ' || u.cognome as reporter_name
       FROM maintenance_requests mr
       JOIN vehicles v ON mr.vehicle_id = v.id
       JOIN users u ON mr.reporter_id = u.id
       WHERE mr.status = 'pending'
       ORDER BY 
         CASE mr.priority
           WHEN 'alta' THEN 1
           WHEN 'media' THEN 2
           WHEN 'bassa' THEN 3
         END,
         mr.created_at DESC`,
      [],
      callback
    );
  }

  static updateStatus(id, status, resolved_by, resolution_notes, callback) {
    const updates = ['status = ?'];
    const params = [status];
    
    if (status === 'resolved') {
      updates.push('resolved_at = datetime("now")');
      updates.push('resolved_by = ?');
      updates.push('resolution_notes = ?');
      params.push(resolved_by, resolution_notes);
    } else if (status === 'in_riparazione') {
      // Solo aggiorna lo status, non resolved_at
      params.push(id);
    } else {
      params.push(id);
    }
    
    if (status !== 'in_riparazione') {
      params.push(id);
    }
    
    db.run(
      `UPDATE maintenance_requests SET ${updates.join(', ')} WHERE id = ?`,
      params,
      callback
    );
  }

  static changeStatus(id, newStatus, callback) {
    db.run(
      `UPDATE maintenance_requests SET status = ? WHERE id = ?`,
      [newStatus, id],
      callback
    );
  }
}

module.exports = { Vehicle, Assignment, Maintenance };
