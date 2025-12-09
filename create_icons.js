const fs = require('fs');
const path = require('path');

// Icona SVG ottimizzata per PWA
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#27AE60" rx="80"/>
  <g transform="translate(256, 256)">
    <!-- Camion stilizzato -->
    <path d="M-120,-60 L80,-60 L80,-20 L100,-20 L120,20 L120,60 L-120,60 Z" 
          fill="#ffffff" stroke="#2C3E50" stroke-width="8"/>
    <!-- Cabina -->
    <rect x="-120" y="-60" width="80" height="80" fill="#ffffff" stroke="#2C3E50" stroke-width="6"/>
    <!-- Finestra -->
    <rect x="-110" y="-50" width="60" height="40" fill="#3498db"/>
    <!-- Ruote -->
    <circle cx="-80" cy="60" r="25" fill="#2C3E50"/>
    <circle cx="60" cy="60" r="25" fill="#2C3E50"/>
    <circle cx="-80" cy="60" r="12" fill="#95a5a6"/>
    <circle cx="60" cy="60" r="12" fill="#95a5a6"/>
    <!-- Box cargo -->
    <rect x="-20" y="-40" width="100" height="80" fill="#ecf0f1" stroke="#2C3E50" stroke-width="6"/>
    <!-- Linee cargo -->
    <line x1="-20" y1="-10" x2="80" y2="-10" stroke="#bdc3c7" stroke-width="3"/>
    <line x1="-20" y1="10" x2="80" y2="10" stroke="#bdc3c7" stroke-width="3"/>
  </g>
</svg>`;

// Directory di output
const outputDir = path.join(__dirname, 'public', 'icons');

// Crea directory se non esiste
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Salva icona SVG
fs.writeFileSync(path.join(outputDir, 'icon.svg'), svgIcon);
console.log('✅ Icona SVG creata: public/icons/icon.svg');

console.log('\n📝 Per generare le icone PNG:');
console.log('1. Visita https://realfavicongenerator.net/');
console.log('2. Carica il file: public/icons/icon.svg');
console.log('3. Scarica e sostituisci le icone in public/icons/');
console.log('\nOppure usa questo SVG direttamente nel manifest.json (supportato da Chrome/Edge)');
