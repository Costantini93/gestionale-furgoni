# 🌐 Come Condividere il Sito con un Amico

## Metodo 1: NGROK (Consigliato - Più Stabile)

### Installazione:
1. Vai su https://ngrok.com/download
2. Scarica la versione Windows
3. Estrai il file `ngrok.exe` nella cartella del progetto

### Utilizzo:
1. Assicurati che il server sia in esecuzione:
   ```powershell
   npm start
   ```

2. In un nuovo terminale PowerShell, lancia:
   ```powershell
   .\ngrok.exe http 3000
   ```

3. Vedrai un output tipo:
   ```
   Forwarding    https://abc123.ngrok-free.app -> http://localhost:3000
   ```

4. **Condividi l'URL `https://abc123.ngrok-free.app` con il tuo amico!**

### Note:
- ✅ Funziona da qualsiasi parte del mondo
- ✅ HTTPS automatico
- ✅ Il database funziona normalmente
- ⚠️ L'URL cambia ogni volta che riavvii ngrok (versione gratuita)
- ⚠️ Prima volta richiede di cliccare "Visit Site" (anti-abuse ngrok)

---

## Metodo 2: LocalTunnel (Più Veloce da Installare)

### Installazione:
```powershell
npm install -g localtunnel
```

### Utilizzo:
1. Server in esecuzione (`npm start`)
2. Nuovo terminale:
   ```powershell
   npx localtunnel --port 3000
   ```

3. Ti darà un URL tipo: `https://funny-cats-12345.loca.lt`

4. **Condividi l'URL con l'amico**

### Note:
- ✅ Installazione velocissima
- ⚠️ Richiede password al primo accesso (mostrata nel terminale)
- ⚠️ Meno stabile di ngrok

---

## Metodo 3: Solo Rete Locale (Stesso WiFi)

1. Trova il tuo IP locale:
   ```powershell
   ipconfig
   ```
   Cerca "IPv4" → es. `192.168.1.100`

2. Condividi: `http://192.168.1.100:3000`

### Note:
- ✅ Gratuito e veloce
- ❌ Funziona SOLO sulla stessa rete WiFi

---

## ⚠️ IMPORTANTE - Dati di Test

Per far provare il sito al tuo amico, puoi creargli un account test:

### Login Admin (esistente):
- Username: `admin`
- Password: `admin123`

### Login Dipendente (da creare):
Vai su http://localhost:3000/admin → "Gestisci Dipendenti" → "Aggiungi Nuovo Dipendente"

---

## 🔒 Sicurezza

⚠️ **NON USARE IN PRODUZIONE** senza:
1. Cambiare la password admin
2. Aggiungere autenticazione HTTPS
3. Configurare SESSION_SECRET sicuro
4. Limitare gli accessi

Questi tunnel sono OK per TEST e DEMO, NON per uso aziendale reale!
