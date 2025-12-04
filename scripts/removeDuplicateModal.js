const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'views', 'rider', 'dashboard.ejs');

console.log('📖 Leggo il file...');
let content = fs.readFileSync(filePath, 'utf8');

// Trova il secondo "// ===== MODAL COMPLETA RIENTRO =====" e rimuovi tutto fino a </script>
const lines = content.split('\n');
let firstModalFound = false;
let startRemove = -1;
let endRemove = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('// ===== MODAL COMPLETA RIENTRO =====')) {
    if (!firstModalFound) {
      firstModalFound = true;
      console.log(`✓ Prima definizione trovata alla riga ${i + 1}`);
    } else {
      startRemove = i;
      console.log(`⚠ Seconda definizione duplicata trovata alla riga ${i + 1}`);
    }
  }
  
  if (startRemove !== -1 && endRemove === -1 && line.trim() === '</script>') {
    endRemove = i;
    console.log(`⚠ Fine sezione duplicata alla riga ${i + 1}`);
  }
}

if (startRemove !== -1 && endRemove !== -1) {
  // Rimuovi le righe duplicate
  lines.splice(startRemove, endRemove - startRemove + 1);
  
  content = lines.join('\n');
  
  // Backup
  fs.writeFileSync(filePath + '.backup4', fs.readFileSync(filePath, 'utf8'));
  console.log('💾 Backup creato: dashboard.ejs.backup4');
  
  // Scrivi file pulito
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Rimosso blocco duplicato dalle righe ${startRemove + 1} a ${endRemove + 1}`);
  console.log('✅ File pulito salvato!');
} else {
  console.log('❌ Blocco duplicato non trovato');
}
