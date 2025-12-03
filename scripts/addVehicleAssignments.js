const db = require('../config/database');

console.log('🚀 Adding vehicle assignments system...\n');

const SQL_VEHICLES = `
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  targa TEXT UNIQUE NOT NULL,
  modello TEXT NOT NULL,
  anno INTEGER,
  km_totali INTEGER DEFAULT 0,
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

// Insert sample vehicles
const SAMPLE_VEHICLES = [
  { targa: 'AB123CD', modello: 'Fiat Ducato', anno: 2021 },
  { targa: 'EF456GH', modello: 'Mercedes Sprinter', anno: 2022 },
  { targa: 'IJ789KL', modello: 'Ford Transit', anno: 2020 },
  { targa: 'MN012OP', modello: 'Iveco Daily', anno: 2023 }
];

async function migrate() {
  try {
    // Create tables
    console.log('📦 Creating vehicles table...');
    await new Promise((resolve, reject) => {
      db.run(SQL_VEHICLES, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Vehicles table created');

    console.log('📋 Creating assignments table...');
    await new Promise((resolve, reject) => {
      db.run(SQL_ASSIGNMENTS, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Assignments table created');

    console.log('🔧 Creating maintenance table...');
    await new Promise((resolve, reject) => {
      db.run(SQL_MAINTENANCE, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Maintenance table created');

    // Insert sample vehicles
    console.log('\n🚚 Adding sample vehicles...');
    for (const vehicle of SAMPLE_VEHICLES) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO vehicles (targa, modello, anno) VALUES (?, ?, ?)',
          [vehicle.targa, vehicle.modello, vehicle.anno],
          (err) => {
            if (err) reject(err);
            else {
              console.log(`  ✓ ${vehicle.targa} - ${vehicle.modello}`);
              resolve();
            }
          }
        );
      });
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
