const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: 'libsql://gestionale-furgoni-costantini93.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function cleanup() {
  try {
    // Delete assignments for December 5-6
    await db.execute(`DELETE FROM vehicle_assignments WHERE data_assegnazione IN ('2025-12-05', '2025-12-06')`);
    console.log('✅ Assegnamenti eliminati per 05-06 dicembre');
    
    // Delete reports for December 5-6
    await db.execute(`DELETE FROM daily_reports WHERE data_giorno IN ('2025-12-05', '2025-12-06')`);
    console.log('✅ Report eliminati per 05-06 dicembre');
    
    // Reset all vehicles to disponibile
    await db.execute(`UPDATE vehicles SET status = 'disponibile' WHERE status = 'assegnato'`);
    console.log('✅ Tutti i veicoli resettati a disponibile');
    
    console.log('\n🎉 Cleanup completato! Pronto per testare assegnazione automatica.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

cleanup();
