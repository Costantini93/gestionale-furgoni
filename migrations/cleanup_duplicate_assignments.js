const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function cleanup() {
  try {
    console.log('🔍 Ricerca assegnamenti duplicati...');
    
    // Trova driver con assegnamenti duplicati per la stessa data
    const duplicates = await client.execute(`
      SELECT rider_id, data_assegnazione, COUNT(*) as count
      FROM vehicle_assignments
      WHERE status = 'attivo'
      GROUP BY rider_id, data_assegnazione
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length === 0) {
      console.log('✅ Nessun assegnamento duplicato trovato!');
      return;
    }
    
    console.log(`⚠️  Trovati ${duplicates.rows.length} casi di assegnamenti duplicati`);
    
    for (const dup of duplicates.rows) {
      const riderId = dup.rider_id;
      const date = dup.data_assegnazione;
      
      console.log(`\n📋 Driver ID ${riderId} - Data ${date} (${dup.count} assegnamenti)`);
      
      // Ottieni tutti gli assegnamenti per questo driver in questa data
      const assignments = await client.execute({
        sql: `
          SELECT va.id, va.vehicle_id, v.targa, va.created_at
          FROM vehicle_assignments va
          JOIN vehicles v ON va.vehicle_id = v.id
          WHERE va.rider_id = ? 
          AND va.data_assegnazione = ?
          AND va.status = 'attivo'
          ORDER BY va.created_at ASC
        `,
        args: [riderId, date]
      });
      
      if (assignments.rows.length > 1) {
        // Mantieni solo il primo (più vecchio), elimina gli altri
        const toKeep = assignments.rows[0];
        console.log(`  ✅ Mantengo: ${toKeep.targa} (creato ${toKeep.created_at})`);
        
        for (let i = 1; i < assignments.rows.length; i++) {
          const toDelete = assignments.rows[i];
          console.log(`  ❌ Elimino: ${toDelete.targa} (creato ${toDelete.created_at})`);
          
          await client.execute({
            sql: 'DELETE FROM vehicle_assignments WHERE id = ?',
            args: [toDelete.id]
          });
        }
      }
    }
    
    console.log('\n✅ Pulizia completata!');
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
    process.exit(1);
  }
}

cleanup();
