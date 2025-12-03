const db = require('../config/database');
const bcrypt = require('bcryptjs');

console.log('🚀 Creating test riders and assignments...\n');

async function createTestData() {
  try {
    // Create test riders
    const testRiders = [
      { username: 'mario', password: 'mario123', nome: 'Mario', cognome: 'Rossi', role: 'rider' },
      { username: 'luigi', password: 'luigi123', nome: 'Luigi', cognome: 'Verdi', role: 'rider' },
      { username: 'paolo', password: 'paolo123', nome: 'Paolo', cognome: 'Bianchi', role: 'rider' }
    ];

    console.log('👥 Creating test riders...');
    
    for (const rider of testRiders) {
      const hashedPassword = await bcrypt.hash(rider.password, 10);
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO users (username, password, nome, cognome, role, first_login) 
           VALUES (?, ?, ?, ?, ?, 0)`,
          [rider.username, hashedPassword, rider.nome, rider.cognome, rider.role],
          function(err) {
            if (err) {
              console.error(`  ❌ Error creating ${rider.username}:`, err.message);
              reject(err);
            } else {
              console.log(`  ✅ ${rider.nome} ${rider.cognome} (${rider.username}/${rider.password.replace(/./g, '*')})`);
              resolve();
            }
          }
        );
      });
    }

    // Get rider IDs
    const riders = await new Promise((resolve, reject) => {
      db.all('SELECT id, username, nome, cognome FROM users WHERE role = ?', ['rider'], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`\n📋 Found ${riders.length} riders in database`);

    // Get vehicles
    const vehicles = await new Promise((resolve, reject) => {
      db.all('SELECT id, targa, modello FROM vehicles ORDER BY id LIMIT 3', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`🚐 Found ${vehicles.length} vehicles\n`);

    // Create assignments
    console.log('🔗 Creating vehicle assignments...');
    
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < Math.min(riders.length, vehicles.length); i++) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO vehicle_assignments 
           (rider_id, vehicle_id, data_assegnazione, status, note) 
           VALUES (?, ?, ?, 'attivo', 'Assegnazione di test')`,
          [riders[i].id, vehicles[i].id, today],
          function(err) {
            if (err) {
              console.error(`  ❌ Error assigning vehicle:`, err.message);
              reject(err);
            } else {
              console.log(`  ✅ ${riders[i].nome} ${riders[i].cognome} → ${vehicles[i].targa} (${vehicles[i].modello})`);
              
              // Update vehicle status
              db.run('UPDATE vehicles SET status = ? WHERE id = ?', ['assegnato', vehicles[i].id], (err2) => {
                if (err2) console.error('    ⚠️  Warning updating vehicle status:', err2.message);
                resolve();
              });
            }
          }
        );
      });
    }

    console.log('\n✅ Test data created successfully!');
    console.log('\n📝 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 mario / mario123 → ' + (vehicles[0] ? vehicles[0].targa : 'no vehicle'));
    console.log('👤 luigi / luigi123 → ' + (vehicles[1] ? vehicles[1].targa : 'no vehicle'));
    console.log('👤 paolo / paolo123 → ' + (vehicles[2] ? vehicles[2].targa : 'no vehicle'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createTestData();
