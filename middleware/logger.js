const db = require('../config/database');

const logActivity = (userId, action, description, req) => {
  const ip_address = req.ip || req.connection.remoteAddress;
  const user_agent = req.headers['user-agent'];
  
  db.run(
    `INSERT INTO activity_log (user_id, action, description, ip_address, user_agent) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, action, description, ip_address, user_agent],
    (err) => {
      if (err) {
        console.error('Errore log attività:', err);
      }
    }
  );
};

module.exports = logActivity;
