// Test calcolo orario italiano

console.log('\n🕐 Test Orario Italiano\n');

// Orario UTC corrente
const now = new Date();
console.log('UTC now:', now.toISOString());
console.log('UTC time:', now.toUTCString());

// Aggiungi 1 ora per UTC+1 (Italia)
const orarioPartenza = new Date(now.getTime() + (60 * 60 * 1000));
console.log('\nItalian time (UTC+1):', orarioPartenza.toISOString());

// Formato per database
const orarioPartenzaStr = orarioPartenza.toISOString().slice(0, 19).replace('T', ' ');
console.log('Database format:', orarioPartenzaStr);

// Come verrà letto e visualizzato
const dateStr = orarioPartenzaStr.replace(' ', 'T');
const visualizzato = new Date(dateStr);
const hours = String(visualizzato.getHours()).padStart(2, '0');
const minutes = String(visualizzato.getMinutes()).padStart(2, '0');
console.log('\nVisualizzato come:', `${hours}:${minutes}`);

// Ora locale del sistema
const localNow = new Date();
const localHours = String(localNow.getHours()).padStart(2, '0');
const localMinutes = String(localNow.getMinutes()).padStart(2, '0');
console.log('Ora sistema locale:', `${localHours}:${localMinutes}`);

console.log('\n✅ Se coincidono, il calcolo è corretto!\n');
