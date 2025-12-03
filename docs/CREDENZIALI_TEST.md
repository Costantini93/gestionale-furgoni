# 🧪 CREDENZIALI DI TEST - GESTIONALE FURGONI

## 👤 ADMIN

```
Username: admin
Password: admin123
```

**Accesso:** http://localhost:3000/auth/login

**Funzionalità disponibili:**
- ✅ Dashboard con tutti i report
- ✅ Filtri avanzati (rider, data, rotta, targa)
- ✅ Export Excel con filtri
- ✅ Assegnazione Furgoni (/admin/assignments)
- ✅ Richieste Manutenzione (/admin/maintenance)
- ✅ Gestione Dipendenti
- ✅ Modifica/Elimina report
- ✅ Ordinamento colonne
- ✅ Eliminazione multipla

---

## 🚚 RIDERS

### 1. Mario Rossi
```
Username: mario
Password: mario123
```
**Furgone assegnato:** EF456GH - Mercedes Sprinter

### 2. Luigi Verdi
```
Username: luigi
Password: luigi123
```
**Furgone assegnato:** IJ789KL - Ford Transit

### 3. Paolo Bianchi
```
Username: paolo
Password: paolo123
```
**Furgone assegnato:** MN012OP - Iveco Daily

### 4. Alessandro Costantini (TU!)
```
Username: alessandro_costantini
Password: [la tua password]
```
**Furgone assegnato:** AB123CD - Fiat Ducato

---

## 🚐 FURGONI DISPONIBILI

| Targa | Modello | Anno | Status | Assegnato a |
|-------|---------|------|--------|-------------|
| AB123CD | Fiat Ducato | 2021 | ✅ Assegnato | Alessandro Costantini |
| EF456GH | Mercedes Sprinter | 2022 | ✅ Assegnato | Mario Rossi |
| IJ789KL | Ford Transit | 2020 | ✅ Assegnato | Luigi Verdi |
| MN012OP | Iveco Daily | 2023 | ✅ Assegnato | Paolo Bianchi |

---

## 🧪 SCENARIO DI TEST CONSIGLIATO

### 1. **TEST RIDER (mario/mario123)**

1. **Login come Mario:**
   - http://localhost:3000/auth/login
   - Username: `mario`
   - Password: `mario123`

2. **Verificare card furgone assegnato:**
   - Dovresti vedere: **EF456GH - Mercedes Sprinter**
   - Bottone "🔧 Segnala Problema" presente

3. **Segnalare un problema:**
   - Clicca "🔧 Segnala Problema"
   - Descrizione: "Rumore strano dal motore durante accelerazione"
   - Priorità: **🔴 Alta - Urgente**
   - Clicca "Invia Richiesta"

4. **Creare un report di partenza:**
   - Data: oggi
   - Targa: EF456GH (auto-compilata)
   - Rotta: R001
   - KM Partenza: 50000
   - Upload 5 foto
   - Firma digitale
   - Clicca "Registra Partenza"

5. **Completare il rientro:**
   - Nella sezione "Report da Completare"
   - Clicca "Completa Rientro"
   - KM Rientro: 50150
   - Orario: automatico
   - Conferma

---

### 2. **TEST ADMIN (admin/admin123)**

1. **Login come Admin:**
   - http://localhost:3000/auth/login
   - Username: `admin`
   - Password: `admin123`

2. **Verificare Dashboard:**
   - Dovresti vedere il report di Mario
   - Stato: **✅ Rientrato**
   - KM Percorsi: 150

3. **Test Export Excel:**
   - Clicca "📊 Esporta Excel"
   - Verifica download file .xlsx
   - Apri con Excel/LibreOffice

4. **Gestire Manutenzioni:**
   - Vai su "🔧 Richieste Manutenzione"
   - Dovresti vedere la richiesta di Mario
   - Badge: **🔴 ALTA** con animazione pulse
   - Clicca "Segna come Risolto"
   - Note risoluzione: "Sostituita cinghia distribuzione"
   - Conferma

5. **Gestire Assegnazioni:**
   - Vai su "🚚 Assegna Furgone"
   - Visualizza tutte le assegnazioni attive
   - Statistiche: 4 totali, 0 disponibili, 4 assegnati

6. **Creare nuova assegnazione:**
   - Prova a riassegnare un furgone già assegnato
   - Dovrebbe dare errore: "Furgone già assegnato per questa data!"
   - Test validazione anti-conflitto ✅

7. **Test filtri avanzati:**
   - Dashboard → Filtri
   - Seleziona Rider: Mario Rossi
   - Clicca "Cerca"
   - Solo i report di Mario
   - Clicca "Esporta Excel" → solo report filtrati

8. **Test ordinamento:**
   - Clicca su header "Data" → ordina crescente
   - Clicca di nuovo → ordina decrescente
   - Prova altre colonne (KM, Targa, etc.)

9. **Test eliminazione multipla:**
   - Seleziona 2-3 report con checkbox
   - Clicca "Elimina Selezionati"
   - Conferma eliminazione

---

### 3. **TEST LUIGI (luigi/luigi123)**

1. **Login come Luigi**
2. **Verificare furgone:** IJ789KL - Ford Transit
3. **Segnalare problema bassa priorità:**
   - "Luce freno posteriore fulminata"
   - Priorità: **🟢 Bassa**

---

### 4. **TEST PAOLO (paolo/paolo123)**

1. **Login come Paolo**
2. **Verificare furgone:** MN012OP - Iveco Daily
3. **Segnalare problema media priorità:**
   - "Climatizzatore non raffredda abbastanza"
   - Priorità: **🟡 Media**

---

## 🎯 CHECKLIST COMPLETA

### ✅ Funzionalità Rider
- [ ] Login funzionante
- [ ] Card furgone assegnato visibile
- [ ] Bottone "Segnala Problema" presente
- [ ] Modal manutenzione funzionante
- [ ] Creazione report partenza
- [ ] Completamento rientro
- [ ] Validazione KM (rientro >= partenza)
- [ ] Toast notifications

### ✅ Funzionalità Admin
- [ ] Dashboard con tutti i report
- [ ] Filtri funzionanti (rider, data, rotta, targa)
- [ ] Export Excel con filtri
- [ ] Ordinamento colonne (7 colonne)
- [ ] Selezione multipla report
- [ ] Eliminazione multipla
- [ ] Pagina Assegnazioni (/admin/assignments)
- [ ] Creazione assegnazione
- [ ] Validazione anti-conflitto
- [ ] Statistiche flotta
- [ ] Pagina Manutenzioni (/admin/maintenance)
- [ ] Visualizzazione richieste per priorità
- [ ] Badge colorati animati
- [ ] Risoluzione richieste con note

### ✅ Grafica Premium
- [ ] Glassmorphism cards
- [ ] Gradient buttons animati
- [ ] Hover effects 3D
- [ ] Pulse animation su badge "In Attesa"
- [ ] Stat cards con icone
- [ ] Section headers con gradients
- [ ] Toast notifications animate
- [ ] Responsive design

---

## 🐛 TROUBLESHOOTING

**Problema:** Non vedo il bottone "Segnala Problema"
**Soluzione:** Il bottone appare solo se hai un furgone assegnato. Verifica di aver fatto login con uno dei rider test (mario/luigi/paolo).

**Problema:** "Furgone già assegnato"
**Soluzione:** Normale! È la validazione anti-conflitto. Cambia data o usa un furgone non assegnato.

**Problema:** Export Excel non scarica
**Soluzione:** Verifica che ci siano report nel database. Almeno 1 report necessario.

**Problema:** Foto non si vedono dopo riavvio
**Soluzione:** Normale con Render free tier (filesystem ephemeral). Implementare Cloudflare R2 per persistenza foto.

---

## 🚀 PROSSIMI TEST

1. **Deploy su Render:**
   - Push già fatto ✅
   - Render sta facendo deploy automatico
   - Vai su https://gestionale-furgoni.onrender.com
   - Ri-esegui `node scripts/createTestRiders.js` su Render

2. **Test Mobile:**
   - Apri da smartphone
   - Verifica responsive design
   - Test upload foto da camera

3. **Test Performance:**
   - Crea 100+ report
   - Test pagination
   - Test filtri con molti dati

---

## 📞 SUPPORTO

Hai problemi? Hai trovato un bug? 
**MANDAMI SCREENSHOT!** 📸

---

**Ultima modifica:** 3 Dicembre 2025
**Versione:** Premium v2.0 🚀
