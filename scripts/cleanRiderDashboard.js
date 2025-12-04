const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'views', 'rider', 'dashboard.ejs');

console.log('🧹 Pulizia caratteri corrotti in rider dashboard...\n');

let content = fs.readFileSync(filePath, 'utf8');

// Sostituzioni dei caratteri corrotti
const replacements = [
  // Emoji e icone
  ['âš ï¸', '⚠️'],
  ['ðŸ"…', '📅'],
  ['ðŸš', '🚐'],
  ['ðŸ—ºï¸', '🗺️'],
  ['ðŸ"', '📊'],
  ['âœ…', '✅'],
  ['ðŸ"§', '🔧'],
  ['ðŸ"–', '📋'],
  ['â›½', '⛽'],
  ['ðŸ"ž', '📞'],
  ['ðŸ"¦', '📦'],
  ['ðŸ"¸', '📸'],
  ['âœ"', '✓'],
  ['Ã—', '×'],
  ['ðŸ', '🏁'],
  ['ï¿½', ''],
  
  // Caratteri speciali
  ['â‚¬', '€'],
];

let changeCount = 0;
replacements.forEach(([from, to]) => {
  const regex = new RegExp(from, 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, to);
    changeCount += matches.length;
    console.log(`✓ Sostituito "${from}" → "${to}" (${matches.length} volte)`);
  }
});

// Backup
const backupPath = filePath + '.backup2';
fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'), 'utf8');

// Salva
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Pulizia completata!`);
console.log(`📝 ${changeCount} sostituzioni effettuate`);
console.log(`💾 Backup salvato: ${backupPath}`);
