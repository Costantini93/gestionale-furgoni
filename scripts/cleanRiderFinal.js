const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'views', 'rider', 'dashboard.ejs');

console.log('🧹 Pulizia COMPLETA dashboard rider...\n');

let content = fs.readFileSync(filePath, 'utf8');

// RIMUOVI TUTTE LE EMOJI E ICONE - stile admin pulito
const cleanups = [
  // Rimuovi emoji comuni
  [/📅\s*/g, ''],
  [/🚐\s*/g, ''],
  [/🗺️\s*/g, ''],
  [/📊\s*/g, ''],
  [/✅\s*/g, ''],
  [/⚠️\s*/g, ''],
  [/🔧\s*/g, ''],
  [/📋\s*/g, ''],
  [/⛽\s*/g, ''],
  [/📞\s*/g, ''],
  [/📦\s*/g, ''],
  [/📸\s*/g, ''],
  [/✓\s*/g, ''],
  [/🏁\s*/g, ''],
  [/🕐\s*/g, ''],
  [/✍️\s*/g, ''],
  [/🗑️\s*/g, ''],
  [/📝\s*/g, ''],
  
  // Rimuovi caratteri corrotti
  [/ðŸ[\s\S]{0,3}/g, ''],
  [/âœ[\s\S]{0,3}/g, ''],
  [/â[\s\S]{0,3}/g, ''],
  [/ï¿½/g, ''],
  [/Ã—/g, '×'],
  
  // Pulizia label specifiche (sostituisci testo con emoji con testo pulito)
  ['Data', 'Data'],
  ['Targa Furgone', 'Targa Furgone'],
  ['Codice Rotta', 'Codice Rotta'],
  ['Km Partenza', 'Km Partenza'],
  ['Km Rientro', 'Km Rientro'],
  ['Orario Rientro', 'Orario Rientro'],
  ['Numero Scheda DKV', 'Numero Scheda DKV'],
  ['Importo Rifornimento', 'Importo Rifornimento'],
  ['Numero Aziendale', 'Numero Aziendale'],
  ['Numero Pacchi Resi', 'Numero Pacchi Resi'],
  ['Pacchi Ritornati', 'Pacchi Ritornati'],
  ['Rifornimento', 'Rifornimento'],
  ['FIRMA - Firma qui sotto per confermare', 'Firma Digitale'],
  ['Foto del Furgone (Obbligatorie)', 'Foto Furgone'],
  ['Foto Posteriore', 'Posteriore'],
  ['Foto Anteriore', 'Anteriore'],
  ['Foto Lato Destro', 'Lato Destro'],
  ['Foto Lato Sinistro', 'Lato Sinistro'],
  ['Foto Interno', 'Interno'],
];

// Backup
const backupPath = filePath + '.backup3';
fs.writeFileSync(backupPath, content, 'utf8');

// Applica pulizie
cleanups.forEach(cleanup => {
  if (Array.isArray(cleanup) && cleanup.length === 2 && typeof cleanup[0] === 'string') {
    // Semplice sostituzione stringa
    const count = (content.match(new RegExp(cleanup[0], 'g')) || []).length;
    if (count > 0) {
      console.log(`✓ "${cleanup[0]}" → "${cleanup[1]}" (${count}x)`);
    }
  } else if (cleanup[0] instanceof RegExp) {
    // Regex
    const matches = content.match(cleanup[0]);
    if (matches) {
      content = content.replace(cleanup[0], cleanup[1] || '');
      console.log(`✓ Rimosso pattern (${matches.length}x)`);
    }
  }
});

// Fix specifico per il modal rotto
content = content.replace(/🏁"\s*Km Rientro/g, 'Km Rientro');
content = content.replace(/<!--\s*Sezione Foto Furgone\s*-->/g, '<!-- Foto Furgone -->');

// Salva
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Pulizia completata!');
console.log('💾 Backup: ' + backupPath);
console.log('\n🎨 Dashboard rider ora pulita come quella admin!');
