require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log('🚀 Creating vehicles system in Turso...\n');

const SQL_VEHICLES = `
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_plate TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  anno INTEGER,
  status TEXT DEFAULT 'disponibile',
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`;

const SQL_ASSIGNMENTS = `
CREATE TABLE IF NOT EXISTS vehicle_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rider_id INTEGER NOT NULL,
  vehicle_id INTEGER NOT NULL,
  data_assegnazione TEXT NOT NULL,
  data_riconsegna TEXT,
  km_partenza INTEGER,
  km_rientro INTEGER,
  status TEXT DEFAULT 'attivo',
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (rider_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
)`;

const SQL_MAINTENANCE = `
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  reporter_id INTEGER NOT NULL,
  issue_description TEXT NOT NULL,
  priority TEXT DEFAULT 'media',
  status TEXT DEFAULT 'pending',
  photo_path TEXT,
  resolved_at TEXT,
  resolved_by INTEGER,
  resolution_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
)`;

// Sample vehicles
const SAMPLE_VEHICLES = [
  { license_plate: 'AB123CD', model: 'Fiat Ducato', anno: 2021 },
  { license_plate: 'EF456GH', model: 'Mercedes Sprinter', anno: 2022 },
  { license_plate: 'IJ789KL', model: 'Ford Transit', anno: 2020 },
  { license_plate: 'MN012OP', model: 'Iveco Daily', anno: 2023 },
  { license_plate: 'QR345ST', model: 'Renault Master', anno: 2022 }
];

async function migrate() {
  try {
    console.log('📦 Creating vehicles table...');
    await db.execute(SQL_VEHICLES);
    console.log('✅ Vehicles table created');

    console.log('📋 Creating assignments table...');
    await db.execute(SQL_ASSIGNMENTS);
    console.log('✅ Assignments table created');

    console.log('🔧 Creating maintenance table...');
    await db.execute(SQL_MAINTENANCE);
    console.log('✅ Maintenance table created');

    console.log('\n🚚 Adding sample vehicles...');
    for (const vehicle of SAMPLE_VEHICLES) {
      try {
        await db.execute({
          sql: 'INSERT INTO vehicles (license_plate, model, anno) VALUES (?, ?, ?)',
          args: [vehicle.license_plate, vehicle.model, vehicle.anno]
        });
        console.log(`  ✓ ${vehicle.license_plate} - ${vehicle.model} (${vehicle.anno})`);
      } catch (err) {
        if (err.message.includes('UNIQUE')) {
          console.log(`  ⚠️  ${vehicle.license_plate} già esistente (skip)`);
        } else {
          throw err;
        }
      }
    }

    // Verifica quanti veicoli ci sono
    console.log('\n📊 Verifica database...');
    const result = await db.execute('SELECT COUNT(*) as count FROM vehicles');
    console.log(`✅ Totale veicoli nel database: ${result.rows[0].count}`);

    console.log('\n✨ Migration completata con successo!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration fallita:', err.message);
    process.exit(1);
  }
}

migrate();
