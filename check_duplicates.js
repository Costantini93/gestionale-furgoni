const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: 'libsql://gestionale-furgoni-costantini93.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkDuplicates() {
  try {
    // Check duplicates
    const duplicates = await db.execute(`
      SELECT driver_id, COUNT(*) as count 
      FROM roster_daily 
      WHERE roster_date = '2025-12-06' 
      GROUP BY driver_id 
      HAVING count > 1
    `);
    
    console.log('🔍 Duplicati per 06/12:', duplicates.rows);
    
    // Get all drivers for this date
    const allDrivers = await db.execute(`
      SELECT u.nome, u.cognome, rd.* 
      FROM roster_daily rd 
      JOIN users u ON rd.driver_id = u.id 
      WHERE roster_date = '2025-12-06'
      ORDER BY u.cognome
    `);
    
    console.log('\n👥 Tutti i driver per 06/12:');
    allDrivers.rows.forEach(row => {
      console.log(`  - ${row.nome} ${row.cognome} (ID: ${row.driver_id}, Row ID: ${row.id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

checkDuplicates();
