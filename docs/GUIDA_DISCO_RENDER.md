# 🚀 GUIDA RAPIDA: Configurare Disco Persistente su Render (2 minuti!)

## 🎯 Obiettivo
Evitare che il database venga cancellato ad ogni restart/deploy di Render.

---

## 📝 PROCEDURA (Step by Step)

### 1️⃣ Vai su Render Dashboard
🔗 https://dashboard.render.com

### 2️⃣ Seleziona il Servizio
- Clicca su **"gestionale-furgoni"** (il tuo web service)

### 3️⃣ Vai su "Disks"
- Nel menu laterale sinistro, clicca su **"Disks"**
- Vedrai scritto: *"No disks configured"*

### 4️⃣ Aggiungi Disco
- Clicca il pulsante blu **"Add Disk"**

### 5️⃣ Configura il Disco
Compila i campi esattamente così:

```
┌─────────────────────────────────────────────┐
│ Name: database-disk                         │
│                                             │
│ Mount Path: /opt/render/project/src/data   │
│                                             │
│ Size: 1 GB                                  │
│                                             │
│ [ Create Disk ]                             │
└─────────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:**
- Il nome deve essere **esattamente** `database-disk`
- Il mount path deve essere **esattamente** `/opt/render/project/src/data`
- Size: 1 GB è gratis e sufficiente per migliaia di report!

### 6️⃣ Salva
- Clicca **"Create Disk"**
- Render chiederà conferma → clicca **"Yes, Create"**

### 7️⃣ Attendi Deploy Automatico
- Il servizio si riavvierà automaticamente (1-2 minuti)
- Vedrai il build log scorrere

### 8️⃣ Verifica nei Log
Una volta completato il deploy, vai su **"Logs"** e cerca:

```
✅ Dovresti vedere:
🔵 RENDER: Uso disco persistente: /opt/render/project/src/data
📂 Database path: /opt/render/project/src/data/database.db
✅ Connesso al database SQLite

❌ NON dovresti vedere:
💻 LOCAL: Uso directory progetto
```

---

## 🎉 FATTO!

Ora il tuo database è **persistente**:
- ✅ Sopravvive ai restart
- ✅ Sopravvive ai deploy
- ✅ Dati al sicuro
- ✅ Zero costi extra (piano free)

---

## 🧪 TEST (Opzionale)

Per verificare che funzioni:

1. **Crea un report** nell'app
2. Vai su Render Dashboard → **"Manual Deploy"** → **"Clear build cache & deploy"**
3. Attendi deploy (2-3 minuti)
4. **Riapri l'app** e verifica che il report c'è ancora! 🎉

---

## 📸 Screenshot Passo-Passo

### Passo 3: Menu "Disks"
```
┌─────────────────────────┐
│ ← gestionale-furgoni    │
├─────────────────────────┤
│   Environment           │
│   Disks          ◄━━━   │ Clicca qui!
│   Settings              │
│   Logs                  │
└─────────────────────────┘
```

### Passo 4: Pagina Disks
```
┌──────────────────────────────────────────┐
│  Disks                                   │
│                                          │
│  No disks configured                     │
│                                          │
│  [ + Add Disk ]  ◄━━━ Clicca qui!       │
└──────────────────────────────────────────┘
```

### Passo 5: Form di Creazione
```
┌──────────────────────────────────────────┐
│  Create Disk                             │
├──────────────────────────────────────────┤
│  Name *                                  │
│  ┌────────────────────────────────────┐  │
│  │ database-disk                      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Mount Path *                            │
│  ┌────────────────────────────────────┐  │
│  │ /opt/render/project/src/data       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Size *                                  │
│  ┌─────┐                                 │
│  │ 1   │ GB  (Free: up to 1 GB)         │
│  └─────┘                                 │
│                                          │
│  [ Cancel ]  [ Create Disk ]             │
└──────────────────────────────────────────┘
```

### Passo 8: Log Success
```
Dec 03 12:34:56 PM  ==> Starting service...
Dec 03 12:34:57 PM  🔵 RENDER: Uso disco persistente: /opt/render/project/src/data
Dec 03 12:34:57 PM  📂 Database path: /opt/render/project/src/data/database.db
Dec 03 12:34:57 PM  ✅ Connesso al database SQLite
Dec 03 12:34:58 PM  Server avviato su http://localhost:3000
```

---

## ❓ Domande Frequenti

**Q: Quanto costa?**  
A: **€0** - Il piano free include 1 GB gratis!

**Q: Posso aumentare lo spazio dopo?**  
A: Sì, vai su Disks → Edit → cambia size (costa €0.25/GB/mese oltre il primo)

**Q: Cosa succede se supero 1 GB?**  
A: Render ti avvisa via email e l'app smette di scrivere dati (read-only). Ma ci vogliono 20.000+ report per arrivare a 1 GB!

**Q: Posso fare backup?**  
A: Sì! Ho aggiunto lo script:
```bash
npm run backup
```
Crea un backup timestampato nella cartella `backups/`

**Q: I log dicono ancora "LOCAL"?**  
A: Verifica che:
1. Il disco sia stato creato correttamente
2. Il mount path sia esatto: `/opt/render/project/src/data`
3. Il deploy sia completato (non in corso)

---

## 🆘 Problemi?

Se qualcosa non funziona:

1. **Controlla Logs** per errori
2. **Riavvia manualmente** il servizio (Dashboard → Manual Deploy → Deploy)
3. **Verifica mount path** (deve essere identico)
4. **Contatta Render Support** (molto reattivi!)

O scrivimi se serve aiuto! 😊

---

*Guida creata: 03/12/2025*  
*Tempo stimato: 2-3 minuti*  
*Difficoltà: 🟢 Facile*
