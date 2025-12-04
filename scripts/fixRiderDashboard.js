const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'views', 'rider', 'dashboard.ejs');

console.log('📝 Lettura file dashboard.ejs...');
let content = fs.readFileSync(filePath, 'utf8');

// Trova la sezione del form da sostituire (da "Form inserimento PARTENZA" fino alla fine delle foto anteriori)
const startMarker = '<!-- Form inserimento PARTENZA -->';
const endMarker = '<input type="file" id="foto_anteriore" name="foto_anteriore" accept="image/*" capture="environment" required>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('❌ Marker non trovati!');
  process.exit(1);
}

// Estrai le parti prima e dopo
const before = content.substring(0, startIndex);
const after = content.substring(endIndex + endMarker.length);

// Nuovo form pulito
const newForm = `<!-- Form inserimento PARTENZA -->
    <div class="card">
      <% if (preparationReport) { %>
        <h3>📝 Completa la Tua Partenza</h3>
        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">
          Assegnamento del <%= new Date(preparationReport.data_giorno).toLocaleDateString('it-IT') %> - Completa i dati e scatta le 5 foto prima di partire
        </p>
        <form action="/rider/report/create" method="POST" id="reportForm" enctype="multipart/form-data">
          <input type="hidden" name="report_id" value="<%= preparationReport.id %>">
          
          <div class="form-row">
            <div class="form-group">
              <label for="data_giorno">📅 Data</label>
              <input type="date" id="data_giorno" name="data_giorno" value="<%= preparationReport.data_giorno %>" readonly style="background: #1e293b; cursor: not-allowed; color: #94a3b8;">
            </div>

            <div class="form-group">
              <label for="targa_furgone">🚐 Targa Furgone</label>
              <input type="text" id="targa_furgone" name="targa_furgone" value="<%= preparationReport.targa_furgone %>" readonly style="background: #1e293b; cursor: not-allowed; color: #94a3b8;">
            </div>

            <div class="form-group">
              <label for="codice_rotta">🗺️ Codice Rotta *</label>
              <input type="text" id="codice_rotta" name="codice_rotta" placeholder="ES: R001" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="km_partenza">📊 Km Partenza *</label>
              <input type="number" id="km_partenza" name="km_partenza" min="0" required>
            </div>

            <div class="form-group">
              <label for="numero_scheda_dkv">📋 Numero Scheda DKV</label>
              <input type="text" id="numero_scheda_dkv" name="numero_scheda_dkv" placeholder="Opzionale">
            </div>

            <div class="form-group">
              <label for="importo_rifornimento">⛽ Importo Rifornimento (€)</label>
              <input type="number" id="importo_rifornimento" name="importo_rifornimento" step="0.01" min="0" placeholder="0.00">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="numero_aziendale">📞 Numero Aziendale</label>
              <input type="text" id="numero_aziendale" name="numero_aziendale" placeholder="Opzionale">
            </div>

            <div class="form-group">
              <label for="pacchi_resi">📦 Numero Pacchi Resi</label>
              <input type="number" id="pacchi_resi" name="pacchi_resi" min="0" placeholder="0">
            </div>

            <div class="form-group">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #e2e8f0;">
                ✍️ FIRMA - Firma qui sotto per confermare *
              </label>
              <div style="border: 2px solid #6366f1; border-radius: 8px; background: white; margin-bottom: 0.5rem;">
                <canvas id="signatureCanvas" width="300" height="150" style="display: block; width: 100%; touch-action: none;"></canvas>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button type="button" onclick="clearSignature()" class="btn btn-secondary" style="flex: 1; padding: 0.5rem;">
                  🗑️ Cancella
                </button>
              </div>
              <input type="hidden" id="firma" name="firma" required>
            </div>
          </div>

          <!-- Sezione Foto Furgone -->
          <div class="form-section">
            <h4 style="color: #6366f1; margin-bottom: 1rem;">📸 Foto del Furgone (Obbligatorie)</h4>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;">
              Scatta o carica 5 foto del furgone prima di partire
            </p>

            <div class="foto-grid">
              <div class="foto-upload-box">
                <label for="foto_posteriore" class="foto-label">
                  <span>📸 Foto Posteriore *</span>
                  <input type="file" id="foto_posteriore" name="foto_posteriore" accept="image/*" capture="environment" required>
                </label>
                <div class="foto-preview" id="preview_posteriore"></div>
                <div class="foto-upload-progress" id="progress_posteriore">
                  <div class="foto-upload-progress-bar"></div>
                </div>
                <div class="foto-success" id="success_posteriore">✓</div>
              </div>

              <div class="foto-upload-box">
                <label for="foto_anteriore" class="foto-label">
                  <span>📸 Foto Anteriore *</span>
                  <input type="file" id="foto_anteriore" name="foto_anteriore" accept="image/*" capture="environment" required`;

// Ricostruisci il file
const newContent = before + newForm + after;

// Backup del file originale
const backupPath = filePath + '.backup';
fs.writeFileSync(backupPath, content, 'utf8');
console.log('✅ Backup creato:', backupPath);

// Scrivi il nuovo file
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ File dashboard.ejs aggiornato!');
console.log('\nModifiche applicate:');
console.log('- Rimossi caratteri corrotti');
console.log('- Emoji corrette e leggibili');
console.log('- Campi Data e Targa readonly e precompilati');
console.log('- Form visibile solo se esiste preparationReport');
