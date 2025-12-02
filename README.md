# 🚚 Gestionale Consegne Furgoni

Sistema web completo per la gestione delle consegne pacchi con rider.

## 📋 Funzionalità

### Per i Rider:
- ✅ Login con credenziali personali (username: nome_cognome, password iniziale: 1234)
- ✅ Cambio password obbligatorio al primo accesso
- ✅ Inserimento dati giornalieri:
  - Data del giorno
  - Firma digitale (checkbox)
  - Targa furgone
  - Codice rotta
  - Km partenza e rientro
  - Orario rientro
  - Numero scheda DKV
  - Importo rifornimento
  - Numero aziendale
  - Numero pacchi resi
- ✅ Visualizzazione storico personale
- ✅ Dati non modificabili dopo conferma

### Per l'Admin:
- ✅ Dashboard completa con tutti i dati
- ✅ Visualizzazione in tempo reale
- ✅ Filtro per singolo rider
- ✅ Modifica e cancellazione dati
- ✅ Esportazione in Excel
- ✅ Vista tabellare completa

## 🚀 Installazione e Avvio

### 1. Installa le dipendenze
Apri PowerShell nella cartella del progetto ed esegui:

```powershell
npm install
```

### 2. Inizializza il database
Crea il database e gli utenti di esempio:

```powershell
npm run init-db
```

Questo comando creerà:
- **Admin**: username `admin`, password `1234`
- **Rider di esempio**: 
  - `mario_rossi` - password `1234`
  - `luigi_verdi` - password `1234`
  - `anna_bianchi` - password `1234`

### 3. Avvia il server
```powershell
npm start
```

Il server sarà disponibile su: **http://localhost:3000**

## 👥 Aggiungere Nuovi Rider

Per aggiungere un nuovo rider, puoi:

1. **Usare il database direttamente** - Installa un visualizzatore SQLite (es. DB Browser for SQLite)
2. **Modificare lo script initDb.js** - Aggiungi nuovi rider nell'array e riesegui `npm run init-db`

Esempio di aggiunta rider nello script:

```javascript
const riders = [
  { username: 'mario_rossi', nome: 'Mario', cognome: 'Rossi' },
  { username: 'luigi_verdi', nome: 'Luigi', cognome: 'Verdi' },
  { username: 'anna_bianchi', nome: 'Anna', cognome: 'Bianchi' },
  { username: 'nuovo_rider', nome: 'Nuovo', cognome: 'Rider' }  // Aggiungi qui
];
```

## 📱 Utilizzo

### Primo Accesso (Rider):
1. Accedi con username e password forniti
2. Il sistema richiederà di cambiare la password
3. Inserisci una nuova password (minimo 6 caratteri)
4. Conferma e accedi alla dashboard

### Inserimento Dati Giornalieri (Rider):
1. Compila il form con tutti i dati richiesti
2. Spunta la casella "FIRMA" per confermare
3. Clicca "Salva Dati Giornalieri"
4. I dati saranno immediatamente visibili all'admin

### Dashboard Admin:
1. Accedi con le credenziali admin
2. Visualizza tutti i report nella tabella
3. Usa il filtro per vedere un singolo rider
4. Clicca "Esporta in Excel" per scaricare i dati
5. Usa le icone ✏️ per modificare e 🗑️ per eliminare

## 🗂️ Struttura del Progetto

```
ROBI GESTIONALE FURGONI/
├── config/
│   └── database.js          # Configurazione database
├── middleware/
│   └── auth.js              # Middleware autenticazione
├── models/
│   ├── User.js              # Model utenti
│   └── Report.js            # Model report
├── routes/
│   ├── auth.js              # Route autenticazione
│   ├── rider.js             # Route rider
│   └── admin.js             # Route admin
├── views/
│   ├── login.ejs            # Pagina login
│   ├── change-password.ejs  # Cambio password
│   ├── rider/
│   │   └── dashboard.ejs    # Dashboard rider
│   ├── admin/
│   │   └── dashboard.ejs    # Dashboard admin
│   └── 404.ejs              # Pagina errore
├── public/
│   └── css/
│       └── style.css        # Stili CSS
├── scripts/
│   └── initDb.js            # Script inizializzazione DB
├── server.js                # Server principale
├── package.json             # Dipendenze
└── database.db              # Database SQLite (creato automaticamente)
```

## 🔒 Sicurezza

- Le password sono crittografate con bcrypt
- Sessioni protette con cookie HTTP-only
- Middleware di autenticazione su tutte le route protette
- Separazione dei ruoli (rider/admin)
- Validazione dati lato server

## 🛠️ Tecnologie Utilizzate

- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Template Engine**: EJS
- **Autenticazione**: bcryptjs + express-session
- **Export Excel**: ExcelJS
- **CSS**: Custom responsive design

## 📝 Note

- I rider possono inserire un solo report per data
- Solo l'admin può modificare o eliminare i report
- I dati sono salvati in tempo reale
- Il file Excel include tutti i dati con km percorsi calcolati automaticamente

## 🆘 Supporto

Per problemi o domande:
1. Verifica che Node.js sia installato (`node --version`)
2. Assicurati che tutte le dipendenze siano installate (`npm install`)
3. Controlla che il database sia inizializzato (`npm run init-db`)
4. Verifica la porta 3000 sia disponibile

## 📄 Licenza

Questo progetto è di proprietà dell'azienda e per uso interno.

---

**Sviluppato con ❤️ per la gestione delle consegne**
