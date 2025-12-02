# 💾 Configurazione Database Persistente su Render

## ⚠️ PROBLEMA: Database Cancellato ad Ogni Restart

Per default, Render usa filesystem **effimero** → ogni deploy/restart cancella il database SQLite!

---

## ✅ SOLUZIONE: Render Persistent Disk

Ho configurato l'app per usare un **disco persistente** su Render.

---

## 🔧 CONFIGURAZIONE SU RENDER (1 volta sola)

### Metodo 1: Via Dashboard Render (Consigliato)

1. **Vai su Render Dashboard** → https://dashboard.render.com
2. Clicca sul tuo servizio **gestionale-furgoni**
3. Vai su **"Disks"** nel menu laterale
4. Clicca **"Add Disk"**
5. Compila:
   - **Name**: `database-disk`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: `1 GB` (gratis, sufficiente per migliaia di report)
6. Clicca **"Save Changes"**
7. Il servizio si riavvierà automaticamente

### Metodo 2: Via render.yaml (Già Configurato!)

Il file `render.yaml` contiene già la configurazione:

```yaml
disk:
  name: database-disk
  mountPath: /opt/render/project/src/data
  sizeGB: 1
```

Se usi questo metodo:
1. Vai su Dashboard → **"Render.yaml"**
2. Clicca **"Apply render.yaml"**
3. Conferma deployment

---

## 🎯 COME FUNZIONA

Il codice (`config/database.js`) ora controlla automaticamente:

```javascript
// Se esiste /opt/render/project/src/data → usa disco Render
// Altrimenti → usa directory locale (sviluppo)
```

**Sviluppo locale**: `database.db` nella root del progetto  
**Produzione Render**: `/opt/render/project/src/data/database.db` (persistente!)

---

## ✅ VERIFICA CHE FUNZIONI

Dopo aver configurato il disco:

1. **Deploy l'app** (git push)
2. **Vai nei log Render**, dovresti vedere:
   ```
   🔵 RENDER: Uso disco persistente: /opt/render/project/src/data
   📂 Database path: /opt/render/project/src/data/database.db
   ✅ Connesso al database SQLite
   ```
3. **Crea alcuni report** nell'app
4. **Riavvia il servizio** manualmente da Dashboard
5. **Verifica che i dati ci sono ancora** 🎉

---

## 💰 COSTI

| Piano Render | Disco Gratis | Disco Max | Costo Extra |
|--------------|--------------|-----------|-------------|
| **Free** | 1 GB | 1 GB | €0/mese |
| **Starter ($7/mese)** | 1 GB | 10 GB | +€0.25/GB/mese |
| **Standard ($25/mese)** | 10 GB | 100 GB | +€0.25/GB/mese |

**Per questo progetto: 1 GB è più che sufficiente!**

Stima dimensioni:
- Database vuoto: ~100 KB
- 1.000 report: ~5 MB
- 10.000 report: ~50 MB
- 100.000 report: ~500 MB

**Conclusione: 1 GB gratis basta per anni!** 🎉

---

## 🔄 ALTERNATIVE (Se Non Vuoi Usare Render Disk)

### Opzione A: Database Esterno (PostgreSQL/MySQL)
- ✅ Più robusto per produzione
- ✅ Backup automatici
- ❌ Richiede migrare da SQLite
- 💰 Render PostgreSQL: gratis (90 giorni), poi $7/mese

### Opzione B: Turso (SQLite in Cloud)
- ✅ SQLite nativo (no migration)
- ✅ Replica globale
- ✅ 9 GB gratis
- 🔗 https://turso.tech
- 💰 Gratis fino a 9GB, poi $29/mese

### Opzione C: Backup Automatici S3/Cloudflare R2
- ✅ Mantieni SQLite
- ✅ Backup ogni ora su cloud storage
- ❌ Devi implementare restore manuale
- 💰 ~$0.50/mese

**Per ora ti consiglio Render Disk → è gratuito e basta 1 click!** 👍

---

## 🚨 TROUBLESHOOTING

### Problema: "Permission denied" sul disco
**Soluzione**: Verifica che il mount path sia esattamente `/opt/render/project/src/data`

### Problema: Dati ancora cancellati
**Soluzione**: 
1. Controlla log per vedere se usa disco: `🔵 RENDER: Uso disco persistente`
2. Se vedi `💻 LOCAL:` significa che disco non è montato correttamente
3. Riconfigura disco da Dashboard

### Problema: "ENOENT: no such file or directory"
**Soluzione**: Il codice crea automaticamente la directory, ma se persiste:
```bash
# SSH su Render (se hai piano pagato)
mkdir -p /opt/render/project/src/data
```

---

## 📋 CHECKLIST POST-CONFIGURAZIONE

- [ ] Disco creato su Render Dashboard
- [ ] Mount path: `/opt/render/project/src/data`
- [ ] Size: 1 GB
- [ ] Deploy effettuato (git push)
- [ ] Log mostra: `🔵 RENDER: Uso disco persistente`
- [ ] Report creati nell'app
- [ ] Servizio riavviato manualmente
- [ ] Dati ancora presenti dopo restart ✅

---

## 🎉 RISULTATO FINALE

✅ Database **non viene più cancellato** ai restart  
✅ Dati **persistenti** tra deploy  
✅ **Zero costi** extra (piano free)  
✅ **Nessuna modifica** codice necessaria (già fatto!)  
✅ Backup manuale: `database.db` scaricabile da shell Render

---

*Documento creato: Dicembre 2025*  
*Ultima modifica: 03/12/2025*
