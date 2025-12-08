const db = require('./config/database');

const date = '2025-12-05';

console.log(`\n🔍 Verifica assegnazioni e report per ${date}\n`);

// Query per assegnazioni
db.all(`
  SELECT 
    va.vehicle_id,
    va.rider_id,
    u.nome,
    u.cognome,
    v.targa,
    dr.status as report_status,
    dr.created_at
  FROM vehicle_assignments va
  JOIN users u ON va.rider_id = u.id
  JOIN vehicles v ON va.vehicle_id = v.id
  LEFT JOIN daily_reports dr ON dr.user_id = va.rider_id 
    AND dr.data_giorno = va.data_assegnazione
  WHERE va.data_assegnazione = ?
  AND va.status = 'attivo'
`, [date], (err, assignments) => {
  if (err) {
    console.error('Errore:', err);
    process.exit(1);
  }
  
  console.log(`📊 Totale assegnazioni: ${assignments.length}\n`);
  
  assignments.forEach((a, i) => {
    console.log(`${i + 1}. ${a.nome} ${a.cognome} - Targa: ${a.targa}`);
    console.log(`   Vehicle ID: ${a.vehicle_id}, Rider ID: ${a.rider_id}`);
    console.log(`   Report status: ${a.report_status || 'NESSUNO'}`);
    if (a.report_status) {
      console.log(`   Created at: ${a.created_at || 'N/A'}`);
    }
    console.log('');
  });
  
  const inUso = assignments.filter(a => a.report_status === 'in_preparazione' || a.report_status === 'completato').length;
  const assegnati = assignments.filter(a => !a.report_status).length;
  
  console.log(`\n📈 CONTEGGI:`);
  console.log(`   IN USO (report compilato): ${inUso}`);
  console.log(`   ASSEGNATI (senza report): ${assegnati}`);
  console.log(`   TOTALE: ${assignments.length}`);
  
  db.close();
});
