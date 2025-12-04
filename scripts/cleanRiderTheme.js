const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'views', 'rider', 'dashboard.ejs');
let content = fs.readFileSync(filePath, 'utf8');

// Backup
fs.writeFileSync(filePath + '.backup-theme', content);

// Rimuovi stili inline scuri e sostituisci con classi pulite
const replacements = [
  // Navbar scura -> bianca
  [/<body>/, '<body style="background: #F5F7FA;">'],
  
  // Colori testo scuri -> chiari
  [/color: #94a3b8/g, 'color: #7F8C8D'],
  [/color: #64748b/g, 'color: #7F8C8D'],
  [/color: #cbd5e1/g, 'color: #2C3E50'],
  [/color: #f8fafc/g, 'color: #2C3E50'],
  [/color: #e2e8f0/g, 'color: #2C3E50'],
  [/color: #92400e/g, 'color: #7F8C8D'],
  
  // Background cards scuri -> bianchi
  [/background: #1e293b/g, 'background: #FFFFFF'],
  [/background: #0f172a/g, 'background: #FFFFFF'],
  [/background: #334155/g, 'background: #FFFFFF'],
  
  // Vehicle card
  [/class="vehicle-card"/, 'class="card"'],
  
  // Rimuovi stili inline complessi dai bottoni gradient
  [/class="btn-gradient" style="[^"]*">/g, 'class="btn btn-warning">'],
  
  // Form inputs readonly
  [/background: #1e293b; cursor: not-allowed; color: #94a3b8/g, 'background: #F8F9FA; cursor: not-allowed; color: #7F8C8D'],
  
  // Toast e spinner overlay
  [/background: rgba\(15, 23, 42, 0\.95\)/g, 'background: rgba(255, 255, 255, 0.95)'],
  [/background: rgba\(15, 23, 42, 0\.8\)/g, 'background: rgba(0, 0, 0, 0.5)'],
];

replacements.forEach(([search, replace]) => {
  content = content.replace(search, replace);
});

fs.writeFileSync(filePath, content);
console.log('✅ Tema pulito applicato alla dashboard rider');
console.log('📁 Backup salvato come: dashboard.ejs.backup-theme');
