# 🎯 CHECKLIST SETUP TURSO - Passo dopo Passo

## ✅ STEP 1: Crea Account Turso (2 minuti)

- [ ] Vai su https://turso.tech
- [ ] Clicca "Sign Up" o "Get Started"  
- [ ] Autenticati con GitHub (1 click) o Google/Email
- [ ] Autorizza l'accesso

---

## ✅ STEP 2: Crea Database (2 minuti)

- [ ] Nella Dashboard Turso, clicca "Create Database"
- [ ] Nome database: **gestionale-furgoni**
- [ ] Location: **Milan** (o più vicina)
- [ ] Plan: **Starter (FREE - 9GB)**
- [ ] Clicca "Create Database"
- [ ] Attendi 10-20 secondi per creazione

---

## ✅ STEP 3: Ottieni Credenziali (2 minuti)

- [ ] Clicca sul database "gestionale-furgoni"
- [ ] Vai su "Settings" o "Connection"
- [ ] **Copia Database URL**:
  ```
  libsql://gestionale-furgoni-XXXX.turso.io
  ```
- [ ] **Genera e copia Auth Token**:
  - Clicca "Generate Token" o "Create Token"
  - Copia il token (si vede UNA SOLA VOLTA!)
  ```
  eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
  ```

⚠️ **IMPORTANTE:** Salva URL e Token in un posto sicuro (notepad, etc)!

---

## ✅ STEP 4: Configura Localmente (1 minuto)

- [ ] Apri VS Code nel progetto
- [ ] Crea file `.env` nella root (se non esiste)
- [ ] Aggiungi queste righe sostituendo con i tuoi valori:
  ```env
  TURSO_DATABASE_URL=libsql://gestionale-furgoni-XXXX.turso.io
  TURSO_AUTH_TOKEN=eyJhbGciOi...tuo_token...
  NODE_ENV=production
  ```
- [ ] Salva il file `.env`

---

## ✅ STEP 5: Migra Schema Database (1 minuto)

- [ ] Apri terminale in VS Code
- [ ] Esegui:
  ```bash
  npm run migrate-turso
  ```
- [ ] Attendi messaggi di successo:
  ```
  ✅ Tabella users creata
  ✅ Tabella daily_reports creata
  ✅ Tabella activity_log creata
  ✅ MIGRAZIONE COMPLETATA CON SUCCESSO!
  ```

Se vedi errori, verifica che URL e Token nel `.env` siano corretti!

---

## ✅ STEP 6: Testa Localmente (1 minuto)

- [ ] Esegui:
  ```bash
  npm start
  ```
- [ ] Verifica nei log:
  ```
  ☁️  TURSO: Connesso a database cloud
  📂 Database URL: libsql://gestionale-furgoni-XXXX.turso.io
  ✅ Connesso al database
  ```
- [ ] Apri browser: http://localhost:3000
- [ ] Login: `admin` / `admin123`
- [ ] Crea un report di test
- [ ] Se funziona → **tutto ok!** 🎉

---

## ✅ STEP 7: Configura Render (2 minuti)

- [ ] Vai su https://dashboard.render.com
- [ ] Seleziona servizio **gestionale-furgoni**
- [ ] Vai su **Environment** nel menu laterale
- [ ] Clicca **Add Environment Variable**
- [ ] Aggiungi **2 variabili**:
  
  **Variabile 1:**
  ```
  Key: TURSO_DATABASE_URL
  Value: libsql://gestionale-furgoni-XXXX.turso.io
  ```
  
  **Variabile 2:**
  ```
  Key: TURSO_AUTH_TOKEN
  Value: eyJhbGciOi...tuo_token...
  ```

- [ ] Clicca **Save Changes**
- [ ] Render riavvierà automaticamente

---

## ✅ STEP 8: Deploy e Verifica (2 minuti)

- [ ] Il deploy automatico si avvia (già fatto con git push)
- [ ] Attendi 2-3 minuti per completamento build
- [ ] Vai su **Logs** in Render Dashboard
- [ ] Verifica messaggi:
  ```
  ☁️  TURSO: Connesso a database cloud
  ✅ Connesso al database
  Server avviato...
  ```
- [ ] Apri l'app su Render: `https://gestionale-furgoni-XXXX.onrender.com`
- [ ] Login: `admin` / `admin123`
- [ ] Crea un report
- [ ] **Restart manuale** servizio da Dashboard
- [ ] Riapri app → **il report c'è ancora!** 🎉

---

## 🎉 COMPLETATO!

Se tutti gli step hanno ✅ → **Hai database persistente gratis per sempre!**

---

## 🆘 TROUBLESHOOTING

### Problema: "ECONNREFUSED" o "Cannot connect to Turso"
**Causa:** URL o Token sbagliati  
**Soluzione:** 
- Ricontrolla `.env` e variabili Render
- URL deve iniziare con `libsql://`
- Token deve essere completo (lungo ~200+ caratteri)

### Problema: "Table does not exist"
**Causa:** Migrazione non eseguita  
**Soluzione:** 
```bash
npm run migrate-turso
```

### Problema: Log dice "LOCAL: Uso database locale"
**Causa:** Variabili ambiente non configurate  
**Soluzione:**
- Verifica che `.env` contenga TURSO_DATABASE_URL e TURSO_AUTH_TOKEN
- Su Render, verifica in Environment che le variabili siano salvate

### Problema: "Auth token expired"
**Causa:** Token scaduto (raro, durano anni)  
**Soluzione:**
- Vai su Turso Dashboard
- Genera nuovo token
- Aggiorna `.env` e Render Environment

---

## 📊 VERIFICA DATI SU TURSO

Per vedere i dati nel database:

1. Vai su **Turso Dashboard**
2. Clicca su **gestionale-furgoni**
3. Vai su **"Data"** o **"SQL Console"**
4. Esegui query:
   ```sql
   SELECT * FROM users;
   SELECT * FROM daily_reports;
   ```

---

## 💾 BACKUP DATI

Turso fa backup automatici, ma se vuoi fare backup manuale:

1. **Via Dashboard Turso**: Export → Download database
2. **Via Codice** (già configurato):
   ```bash
   npm run backup
   ```

---

## 📈 MONITORAGGIO UTILIZZO

- Dashboard Turso → **"Usage"**
- Vedi:
  - Storage usato (di 9 GB disponibili)
  - Righe lette/scritte questo mese
  - Query totali

**Per questo progetto: utilizzerai < 1% dei limiti gratis!** 🎉

---

*Checklist creata: 03/12/2025*  
*Tempo totale: ~10 minuti*  
*Difficoltà: 🟢 Facile*
