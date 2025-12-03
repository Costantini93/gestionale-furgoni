# 🚀 SETUP TURSO - Guida Completa

## 📋 PARTE 1: Crea Account Turso (2 minuti)

### 1️⃣ Vai su Turso
🔗 https://turso.tech

### 2️⃣ Clicca "Sign Up" o "Get Started"

### 3️⃣ Scegli metodo autenticazione
- **GitHub** (consigliato - 1 click)
- Google
- Email

### 4️⃣ Autorizza l'accesso
Se usi GitHub, autorizza Turso ad accedere al tuo account.

---

## 📋 PARTE 2: Crea Database (3 minuti)

### 1️⃣ Una volta loggato, vai su Dashboard
Dovresti vedere: **"Create your first database"**

### 2️⃣ Clicca "Create Database"

### 3️⃣ Configura database
```
┌─────────────────────────────────────────────┐
│ Database Name: gestionale-furgoni           │
│                                             │
│ Location: [Scegli più vicino, es: Milan]   │
│                                             │
│ Plan: Starter (FREE - 9GB)                  │
│                                             │
│ [ Create Database ]                         │
└─────────────────────────────────────────────┘
```

### 4️⃣ Attendi creazione (10-20 secondi)

---

## 📋 PARTE 3: Ottieni Credenziali (2 minuti)

### 1️⃣ Una volta creato, clicca sul database "gestionale-furgoni"

### 2️⃣ Vai su "Settings" o "Connection"

### 3️⃣ Copia queste 2 informazioni (IMPORTANTE!):

**A) Database URL**
```
libsql://gestionale-furgoni-XXXX.turso.io
```

**B) Auth Token**
Clicca "Generate Token" o "Create Token"
```
eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoi...
```

⚠️ **IMPORTANTE:** Il token si vede **UNA SOLA VOLTA**! Copialo subito!

---

## 📋 PARTE 4: Configura App (3 minuti)

### 1️⃣ Crea file `.env` nella root del progetto

Crea un file chiamato `.env` (se non esiste già) e aggiungi:

```env
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://gestionale-furgoni-XXXX.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoi...

# Ambiente
NODE_ENV=production
```

⚠️ **Sostituisci** con i tuoi valori reali!

### 2️⃣ Aggiungi variabili su Render

1. Vai su **Render Dashboard**
2. Seleziona **gestionale-furgoni**
3. Vai su **Environment**
4. Clicca **Add Environment Variable**
5. Aggiungi:
   ```
   TURSO_DATABASE_URL = libsql://gestionale-furgoni-XXXX.turso.io
   TURSO_AUTH_TOKEN = eyJhbGciOi...
   ```
6. **Save Changes**

---

## ✅ FATTO!

Dopo aver configurato `.env` e Render, il codice che ho preparato:
- ✅ Si connette automaticamente a Turso in produzione
- ✅ Usa SQLite locale in sviluppo
- ✅ Dati persistenti per sempre
- ✅ 9 GB storage gratis!

---

## 🧪 VERIFICA

Dopo il deploy, vai sui **log di Render** e cerca:

```
✅ DOVRESTI VEDERE:
☁️  TURSO: Connesso a database cloud
📂 Database URL: libsql://gestionale-furgoni-XXXX.turso.io
✅ Connesso al database

❌ NON DOVRESTI VEDERE:
💻 LOCAL: Uso database locale
```

---

## 🎁 VANTAGGI TURSO

- ✅ **9 GB gratis** (20.000+ report!)
- ✅ **500 database** gratis
- ✅ **25 miliardi righe lette/mese** gratis
- ✅ **5 milioni righe scritte/mese** gratis
- ✅ **Backup automatici** inclusi
- ✅ **Replica globale** (opzionale)
- ✅ **Zero manutenzione**

Per questo progetto: **GRATIS PER SEMPRE!** 🎉

---

## 📞 PROSSIMI PASSI

1. **Crea account Turso** → https://turso.tech
2. **Crea database** "gestionale-furgoni"
3. **Copia URL + Token**
4. **Dimmi quando hai finito** → configuro il codice! 😊

---

*Guida creata: 03/12/2025*  
*Tempo totale: ~10 minuti*
