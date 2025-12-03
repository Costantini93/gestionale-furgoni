const db = require('../config/database');

console.log('🔧 Aggiunta colonna fixed_vehicle_id alla tabella users...\n');

db.run(
  `ALTER TABLE users ADD COLUMN fixed_vehicle_id INTEGER DEFAULT NULL`,
  (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Colonna fixed_vehicle_id già presente!');
      } else {
        console.error('❌ Errore:', err.message);
      }
    } else {
      console.log('✅ Colonna fixed_vehicle_id aggiunta con successo!');
    }
    
    console.log('\n📊 Struttura tabella users aggiornata.');
    process.exit(0);
  }
);
