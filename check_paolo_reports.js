const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: 'libsql://gestionale-furgoni-costantini93.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkPaoloReports() {
  try {
    // Trova Paolo Romano
    const paolo = await db.execute(`
      SELECT id, nome, cognome FROM users WHERE nome = 'Paolo' AND cognome = 'Romano'
    `);
    
    if (paolo.rows.length === 0) {
      console.log('❌ Paolo Romano non trovato');
      process.exit(1);
    }
    
    const paoloId = paolo.rows[0].id;
    console.log(`✅ Paolo Romano trovato (ID: ${paoloId})`);
    
    // Trova tutti i report di Paolo
    const reports = await db.execute(`
      SELECT * FROM daily_reports WHERE user_id = ? ORDER BY data_giorno DESC
    `, [paoloId]);
    
    console.log(`\n📊 Report di Paolo Romano (${reports.rows.length} totali):\n`);
    
    reports.rows.forEach(report => {
      console.log(`  - ${report.data_giorno} | Status: ${report.status} | Targa: ${report.targa_furgone} | ID: ${report.id}`);
    });
    
    // Verifica oggi
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Data di oggi: ${today}`);
    
    const todayReport = reports.rows.find(r => r.data_giorno === today && r.status === 'in_preparazione');
    
    if (todayReport) {
      console.log(`✅ Report trovato per oggi in preparazione: ID ${todayReport.id}`);
    } else {
      console.log(`❌ Nessun report in preparazione per oggi`);
      
      const prepReports = reports.rows.filter(r => r.status === 'in_preparazione');
      if (prepReports.length > 0) {
        console.log(`\n⚠️  Report in preparazione per altre date:`);
        prepReports.forEach(r => console.log(`    - ${r.data_giorno} (ID: ${r.id})`));
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

checkPaoloReports();
