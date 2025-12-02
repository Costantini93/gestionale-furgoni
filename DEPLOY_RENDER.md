# 🚀 Guida Deploy su Render.com

## Passo 1: Prepara il Progetto su GitHub

### A) Crea un nuovo repository su GitHub
1. Vai su https://github.com/new
2. Nome repository: `gestionale-furgoni` (o quello che preferisci)
3. Seleziona **Private** se vuoi mantenerlo privato
4. NON aggiungere README, .gitignore o licenza (già presenti)
5. Clicca "Create repository"

### B) Carica il progetto su GitHub
Apri PowerShell nella cartella del progetto ed esegui:

```powershell
cd "c:\Users\aleco\OneDrive\Desktop\ROBI GESTIONALE FURGONI"

# Inizializza git (se non già fatto)
git init

# Aggiungi tutti i file
git add .

# Primo commit
git commit -m "Initial commit - Gestionale Furgoni"

# Collega al repository GitHub (SOSTITUISCI con il tuo URL!)
git remote add origin https://github.com/TUO-USERNAME/gestionale-furgoni.git

# Carica su GitHub
git branch -M main
git push -u origin main
```

**⚠️ IMPORTANTE:** Sostituisci `TUO-USERNAME` con il tuo username GitHub nell'URL!

---

## Passo 2: Deploy su Render

### A) Crea account Render
1. Vai su https://render.com
2. Clicca "Get Started for Free"
3. Registrati con GitHub (consigliato) o email

### B) Crea nuovo Web Service
1. Dal dashboard Render, clicca "New +" → "Web Service"
2. Clicca "Connect a repository"
3. Autorizza Render ad accedere ai tuoi repository GitHub
4. Seleziona il repository `gestionale-furgoni`

### C) Configurazione Web Service
Compila i campi:

- **Name**: `gestionale-furgoni` (o quello che preferisci)
- **Region**: Europe (West) - Frankfurt o London
- **Branch**: `main`
- **Root Directory**: (lascia vuoto)
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### D) Variabili d'Ambiente
Clicca su "Advanced" e aggiungi:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | `[genera-una-chiave-casuale-lunga-almeno-32-caratteri]` |

**💡 Tip:** Per generare una chiave sicura, usa:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### E) Deploy!
1. Clicca "Create Web Service"
2. Render inizierà automaticamente il deploy
3. Attendi 3-5 minuti
4. Il tuo sito sarà online su: `https://gestionale-furgoni.onrender.com`

---

## Passo 3: Primo Accesso

1. Apri l'URL fornito da Render
2. Login con:
   - Username: `admin`
   - Password: `admin123`
3. **⚠️ IMPORTANTE:** Cambia subito la password!

---

## 🎉 Fatto!

Il tuo sito è ora:
- ✅ Online 24/7
- ✅ Con URL fisso
- ✅ Database funzionante
- ✅ Upload foto abilitato
- ✅ HTTPS automatico
- ✅ Deploy automatico ad ogni push su GitHub

---

## 📝 Note Importanti

### ⚠️ Limitazioni Piano Free Render:
- Il servizio va in "sleep" dopo 15 minuti di inattività
- Il primo accesso dopo il sleep può richiedere 30-60 secondi
- Storage persistente NON incluso (foto caricate potrebbero essere perse)
- 750 ore/mese di uptime gratis

### 💾 Storage delle Foto:
Per mantenere le foto caricate permanentemente, dovrai:
1. Usare un servizio esterno come AWS S3, Cloudinary, o Backblaze B2
2. Modificare il codice per caricare lì invece che localmente
3. Oppure fare upgrade al piano Render a pagamento ($7/mese)

### 🔄 Aggiornamenti:
Per aggiornare il sito:
```powershell
git add .
git commit -m "Descrizione modifiche"
git push
```
Render farà automaticamente il redeploy!

---

## 🆘 Risoluzione Problemi

### Sito non si avvia:
1. Controlla i log su Render dashboard
2. Verifica che le variabili d'ambiente siano impostate
3. Assicurati che il build sia completato con successo

### Database vuoto:
Il comando `npm run build` dovrebbe creare automaticamente:
- Tabelle database
- Utente admin
- Colonne foto
- Log attività

### Foto non si caricano:
- Verifica che la cartella `public/uploads/foto_furgoni/` esista
- Controlla i permessi di scrittura nei log Render
- Considera l'uso di storage esterno per produzione

---

## 📞 Supporto

Se hai problemi:
1. Controlla i log su Render Dashboard → Service → Logs
2. Verifica che tutte le variabili d'ambiente siano impostate
3. Assicurati che il repository GitHub sia aggiornato

Buon deploy! 🚀
