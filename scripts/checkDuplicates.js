const db = require('../config/database');

console.log('🔍 Controllo report duplicati...\n');

// Query per trovare report duplicati (stesso rider, stessa data)
db.all(
  `SELECT 
    user_id,
    data_giorno,
    COUNT(*) as count,
    GROUP_CONCAT(id) as report_ids
   FROM daily_reports 
   GROUP BY user_id, data_giorno 
   HAVING COUNT(*) > 1
   ORDER BY data_giorno DESC`,
  (err, duplicates) => {
    if (err) {
      console.error('❌ Errore:', err);
      process.exit(1);
    }

    if (duplicates.length === 0) {
      console.log('✅ Nessun report duplicato trovato!');
      console.log('\n📊 Statistiche generali:');
      
      // Mostra totale report
      db.get('SELECT COUNT(*) as total FROM daily_reports', (err, result) => {
        if (!err) {
          console.log(`   Totale report: ${result.total}`);
        }
        process.exit(0);
      });
    } else {
      console.log(`⚠️  Trovati ${duplicates.length} gruppi di report duplicati:\n`);
      
      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. Rider ID: ${dup.user_id} | Data: ${dup.data_giorno}`);
        console.log(`   Report duplicati: ${dup.count} volte`);
        console.log(`   IDs: ${dup.report_ids}\n`);
      });

      // Mostra dettagli dei report duplicati
      console.log('\n📋 Dettagli completi:\n');
      
      const ids = duplicates.map(d => d.report_ids.split(',').map(Number)).flat();
      const placeholders = ids.map(() => '?').join(',');
      
      db.all(
        `SELECT r.id, r.user_id, r.data_giorno, r.status, r.created_at, 
                u.nome, u.cognome, u.username
         FROM daily_reports r
         JOIN users u ON r.user_id = u.id
         WHERE r.id IN (${placeholders})
         ORDER BY r.data_giorno DESC, r.user_id, r.created_at`,
        ids,
        (err, details) => {
          if (!err) {
            details.forEach(report => {
              console.log(`ID: ${report.id} | ${report.nome} ${report.cognome} (@${report.username})`);
              console.log(`Data: ${report.data_giorno} | Status: ${report.status}`);
              console.log(`Creato: ${report.created_at}\n`);
            });
          }
          process.exit(0);
        }
      );
    }
  }
);
