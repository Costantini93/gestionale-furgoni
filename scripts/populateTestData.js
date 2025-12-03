require('dotenv').config();
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function populateTestData() {
  try {
    console.log('🔧 Popolamento database con dati di test...\n');

    // ========== CREA 15 FURGONI ==========
    console.log('📦 Creazione 15 furgoni...');
    const vehicles = [
      { targa: 'AA111BB', modello: 'Fiat Ducato', anno: 2021 },
      { targa: 'AA222CC', modello: 'Iveco Daily', anno: 2020 },
      { targa: 'AA333DD', modello: 'Mercedes Sprinter', anno: 2022 },
      { targa: 'AA444EE', modello: 'Fiat Scudo', anno: 2021 },
      { targa: 'AA555FF', modello: 'Renault Master', anno: 2020 },
      { targa: 'AA666GG', modello: 'Peugeot Boxer', anno: 2021 },
      { targa: 'AA777HH', modello: 'Citroën Jumper', anno: 2022 },
      { targa: 'AA888II', modello: 'Ford Transit', anno: 2020 },
      { targa: 'AA999JJ', modello: 'Volkswagen Crafter', anno: 2021 },
      { targa: 'BB111KK', modello: 'Nissan NV400', anno: 2020 },
      { targa: 'BB222LL', modello: 'Opel Movano', anno: 2021 },
      { targa: 'BB333MM', modello: 'Man TGE', anno: 2022 },
      { targa: 'BB444NN', modello: 'Fiat Talento', anno: 2021 },
      { targa: 'BB555OO', modello: 'Mercedes Vito', anno: 2020 },
      { targa: 'BB666PP', modello: 'Toyota Proace', anno: 2021 }
    ];

    const vehicleIds = [];
    for (const v of vehicles) {
      // Controlla se esiste già
      const existing = await turso.execute({
        sql: 'SELECT id FROM vehicles WHERE targa = ?',
        args: [v.targa]
      });

      if (existing.rows.length === 0) {
        const result = await turso.execute({
          sql: 'INSERT INTO vehicles (targa, modello, anno, status) VALUES (?, ?, ?, ?)',
          args: [v.targa, v.modello, v.anno, 'disponibile']
        });
        vehicleIds.push(Number(result.lastInsertRowid));
        console.log(`  ✅ ${v.targa} - ${v.modello}`);
      } else {
        vehicleIds.push(Number(existing.rows[0].id));
        console.log(`  ⏭️  ${v.targa} già esistente`);
      }
    }

    console.log(`\n✅ ${vehicleIds.length} furgoni pronti!\n`);

    // ========== CREA 15 DRIVER ==========
    console.log('👥 Creazione 15 driver (12 con furgone fisso, 3 casuali)...');
    const hashedPassword = await bcrypt.hash('1234', 10);

    const drivers = [
      // 12 con furgone fisso
      { nome: 'Marco', cognome: 'Bianchi', email: 'marco.bianchi@test.it', cf: 'BNCMRC85M01H501A', fixedVehicleIndex: 0 },
      { nome: 'Luca', cognome: 'Ferrari', email: 'luca.ferrari@test.it', cf: 'FRRLCU90A01H501B', fixedVehicleIndex: 1 },
      { nome: 'Andrea', cognome: 'Russo', email: 'andrea.russo@test.it', cf: 'RSSANR88B01H501C', fixedVehicleIndex: 2 },
      { nome: 'Paolo', cognome: 'Romano', email: 'paolo.romano@test.it', cf: 'RMNPLA92C01H501D', fixedVehicleIndex: 3 },
      { nome: 'Stefano', cognome: 'Galli', email: 'stefano.galli@test.it', cf: 'GLLSTF86D01H501E', fixedVehicleIndex: 4 },
      { nome: 'Matteo', cognome: 'Conti', email: 'matteo.conti@test.it', cf: 'CNTMTT91E01H501F', fixedVehicleIndex: 5 },
      { nome: 'Davide', cognome: 'Ricci', email: 'davide.ricci@test.it', cf: 'RCCDVD89F01H501G', fixedVehicleIndex: 6 },
      { nome: 'Simone', cognome: 'Martini', email: 'simone.martini@test.it', cf: 'MRTSM93G01H501H', fixedVehicleIndex: 7 },
      { nome: 'Roberto', cognome: 'Greco', email: 'roberto.greco@test.it', cf: 'GRCRBT87H01H501I', fixedVehicleIndex: 8 },
      { nome: 'Federico', cognome: 'Barbieri', email: 'federico.barbieri@test.it', cf: 'BRBFDR90I01H501J', fixedVehicleIndex: 9 },
      { nome: 'Alessandro', cognome: 'Fontana', email: 'alessandro.fontana@test.it', cf: 'FNTLSS88J01H501K', fixedVehicleIndex: 10 },
      { nome: 'Giovanni', cognome: 'Santoro', email: 'giovanni.santoro@test.it', cf: 'SNTGVN92K01H501L', fixedVehicleIndex: 11 },
      
      // 3 con furgone casuale (null)
      { nome: 'Michele', cognome: 'Caruso', email: 'michele.caruso@test.it', cf: 'CRSMCH91L01H501M', fixedVehicleIndex: null },
      { nome: 'Riccardo', cognome: 'Rizzi', email: 'riccardo.rizzi@test.it', cf: 'RZZRCC89M01H501N', fixedVehicleIndex: null },
      { nome: 'Fabio', cognome: 'Moretti', email: 'fabio.moretti@test.it', cf: 'MRTFBA90N01H501O', fixedVehicleIndex: null }
    ];

    for (const d of drivers) {
      // Controlla se esiste già
      const existing = await turso.execute({
        sql: 'SELECT id FROM users WHERE username = ?',
        args: [d.email]
      });

      if (existing.rows.length === 0) {
        const fixedVehicleId = d.fixedVehicleIndex !== null ? vehicleIds[d.fixedVehicleIndex] : null;
        
        await turso.execute({
          sql: 'INSERT INTO users (username, password, nome, cognome, codice_fiscale, role, fixed_vehicle_id, is_active, first_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [d.email, hashedPassword, d.nome, d.cognome, d.cf, 'rider', fixedVehicleId, 1, 1]
        });

        const vehicleInfo = fixedVehicleId ? `(Fisso: ${vehicles[d.fixedVehicleIndex].targa})` : '(Casuale)';
        console.log(`  ✅ ${d.nome} ${d.cognome} ${vehicleInfo}`);
      } else {
        console.log(`  ⏭️  ${d.email} già esistente`);
      }
    }

    console.log('\n🎉 Popolamento completato!');
    console.log('\n📊 Riepilogo:');
    console.log(`   • 15 furgoni creati`);
    console.log(`   • 12 driver con furgone fisso`);
    console.log(`   • 3 driver con assegnazione casuale`);
    console.log(`   • Password per tutti: 1234\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

populateTestData();
