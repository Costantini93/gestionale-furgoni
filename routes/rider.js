const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireRider } = require('../middleware/auth');
const Report = require('../models/Report');
const { Assignment, Maintenance } = require('../models/Vehicle');
const logActivity = require('../middleware/logger');
const { detectPriorityWithExplanation } = require('../utils/priorityDetector');

// Configurazione multer per upload foto
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/foto_furgoni/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'foto-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo immagini sono permesse (jpeg, jpg, png, webp)'));
  }
});

// Dashboard rider
router.get('/dashboard', requireRider, (req, res) => {
  const db = require('../config/database');
  
  // Ottieni i report completati del rider
  Report.getByUserId(req.session.userId, (err, reports) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Errore del server');
    }

    // Ottieni i report aperti (in viaggio)
    Report.getOpenReports(req.session.userId, (err2, openReports) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Errore del server');
      }

      // Ottieni report in preparazione SOLO per oggi (creato dall'assegnazione automatica)
      const today = new Date().toISOString().split('T')[0];
      
      db.get(`
        SELECT * FROM daily_reports 
        WHERE user_id = ? 
        AND status = 'in_preparazione'
        AND data_giorno = ?
        LIMIT 1
      `, [req.session.userId, today], (err3, preparationReport) => {
        if (err3) console.error('Error getting preparation report:', err3);

        // Cerca report di sostituzione in attesa
        db.get(`
          SELECT * FROM daily_reports 
          WHERE user_id = ? 
          AND status = 'sostituzione_partenza'
          AND data_giorno = ?
          AND km_partenza IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        `, [req.session.userId, today], (err5, substitutionReport) => {
          if (err5) console.error('Error getting substitution report:', err5);

          // Ottieni furgone assegnato
          Assignment.getByRider(req.session.userId, (err4, assignment) => {
            if (err4) console.error('Error getting assignment:', err4);

            const successMessages = req.flash('success');
            const errorMessages = req.flash('error');

            res.render('rider/dashboard', {
              user: {
                id: req.session.userId,
                username: req.session.username,
                nome: req.session.nome,
                cognome: req.session.cognome
              },
              reports: reports || [],
              openReports: openReports || [],
              preparationReport: preparationReport || null,
              substitutionReport: substitutionReport || null,
              assignment: assignment || null,
              success: successMessages,
              error: errorMessages
            });
          });
        });
      });
    });
  });
});

// Completa report in preparazione (aggiorna con km, foto, firma)
router.post('/report/create', requireRider, upload.fields([
  { name: 'foto_posteriore', maxCount: 1 },
  { name: 'foto_anteriore', maxCount: 1 },
  { name: 'foto_lato_destro', maxCount: 1 },
  { name: 'foto_lato_sinistro', maxCount: 1 },
  { name: 'foto_interno', maxCount: 1 }
]), (req, res) => {
  const db = require('../config/database');
  const {
    report_id,
    codice_rotta,
    km_partenza,
    orario_partenza,
    numero_scheda_dkv,
    importo_rifornimento,
    numero_aziendale,
    pacchi_resi,
    firma
  } = req.body;

  // Validazione base (solo campi partenza)
  if (!report_id || !codice_rotta || !km_partenza || !orario_partenza || !firma) {
    req.flash('error', 'Compila tutti i campi obbligatori per la partenza');
    req.session.save((saveErr) => {
      if (saveErr) console.error('Errore save session:', saveErr);
      return res.redirect('/rider/dashboard');
    });
    return;
  }

  // Ottieni i percorsi delle foto caricate
  const foto_posteriore = req.files['foto_posteriore'] ? '/uploads/foto_furgoni/' + req.files['foto_posteriore'][0].filename : null;
  const foto_anteriore = req.files['foto_anteriore'] ? '/uploads/foto_furgoni/' + req.files['foto_anteriore'][0].filename : null;
  const foto_lato_destro = req.files['foto_lato_destro'] ? '/uploads/foto_furgoni/' + req.files['foto_lato_destro'][0].filename : null;
  const foto_lato_sinistro = req.files['foto_lato_sinistro'] ? '/uploads/foto_furgoni/' + req.files['foto_lato_sinistro'][0].filename : null;
  const foto_interno = req.files['foto_interno'] ? '/uploads/foto_furgoni/' + req.files['foto_interno'][0].filename : null;

  // Aggiorna il report in preparazione con i dati di partenza
  // Calcola orario locale italiano (UTC+1)
  const now = new Date();
  const orarioPartenza = new Date(now.getTime() + (60 * 60 * 1000)); // +1 ora per UTC+1
  const orarioPartenzaStr = orarioPartenza.toISOString().slice(0, 19).replace('T', ' ');

  db.run(`
    UPDATE daily_reports SET
      codice_rotta = ?,
      km_partenza = ?,
      orario_partenza = ?,
      numero_scheda_dkv = ?,
      importo_rifornimento = ?,
      numero_aziendale = ?,
      pacchi_resi = ?,
      firma = ?,
      foto_posteriore = ?,
      foto_anteriore = ?,
      foto_lato_destro = ?,
      foto_lato_sinistro = ?,
      foto_interno = ?,
      status = 'partito',
      orario_partenza_effettivo = ?
    WHERE id = ? AND user_id = ? AND status IN ('in_preparazione', 'sostituzione_partenza')
  `, [
    codice_rotta,
    km_partenza,
    orario_partenza,
    numero_scheda_dkv || null,
    importo_rifornimento || null,
    numero_aziendale || null,
    pacchi_resi || null,
    firma ? 1 : 0,
    foto_posteriore,
    foto_anteriore,
    foto_lato_destro,
    foto_lato_sinistro,
    foto_interno,
    orarioPartenzaStr,
    report_id,
    req.session.userId
  ], (err) => {
    if (err) {
      console.error('Errore aggiornamento report:', err);
      logActivity(req.session.userId, 'REPORT_UPDATE_ERROR', `Errore completamento report ${report_id}`, req);
      req.flash('error', 'Errore durante il salvataggio dei dati');
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        return res.redirect('/rider/dashboard');
      });
      return;
    }

    logActivity(req.session.userId, 'REPORT_PARTENZA', `Partenza registrata - Rotta: ${codice_rotta}, KM: ${km_partenza}`, req);
    req.flash('success', '🚚 Partenza registrata! Buon viaggio! Ricorda di completare il rientro.');
    req.session.save((saveErr) => {
      if (saveErr) console.error('Errore save session:', saveErr);
      res.redirect('/rider/dashboard');
    });
  });
});

// Completa rientro
router.post('/report/complete/:id', requireRider, (req, res) => {
  const reportId = req.params.id;
  const { km_rientro, orario_rientro, pacchi_ritornati, rifornimento_ip, rifornimento_dkv, metodo_rifornimento, numero_scheda_dkv } = req.body;

  // Determina l'importo rifornimento in base al metodo
  let rifornimento_euro = 0;
  if (metodo_rifornimento === 'IP' && rifornimento_ip) {
    rifornimento_euro = parseFloat(rifornimento_ip);
  } else if (metodo_rifornimento === 'DKV' && rifornimento_dkv) {
    rifornimento_euro = parseFloat(rifornimento_dkv);
  }

  // Validazione
  if (!km_rientro || !orario_rientro) {
    req.flash('error', 'Inserisci km e orario di rientro');
    req.session.save((saveErr) => {
      if (saveErr) console.error('Errore save session:', saveErr);
      return res.redirect('/rider/dashboard');
    });
    return;
  }

  // Verifica che il report appartenga all'utente e sia aperto
  Report.getById(reportId, (err, report) => {
    if (err || !report) {
      req.flash('error', 'Report non trovato');
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        return res.redirect('/rider/dashboard');
      });
      return;
    }

    if (report.user_id !== req.session.userId) {
      req.flash('error', 'Non autorizzato');
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        return res.redirect('/rider/dashboard');
      });
      return;
    }

    if (report.status !== 'partito') {
      req.flash('error', 'Questo report è già stato completato');
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        return res.redirect('/rider/dashboard');
      });
      return;
    }

    // Validazione: km_rientro deve essere >= km_partenza
    if (parseInt(km_rientro) < parseInt(report.km_partenza)) {
      req.flash('error', `I km di rientro (${km_rientro}) non possono essere inferiori ai km di partenza (${report.km_partenza})`);
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        return res.redirect('/rider/dashboard');
      });
      return;
    }

    // Completa il rientro
    const returnData = {
      km_rientro,
      orario_rientro,
      pacchi_ritornati: parseInt(pacchi_ritornati) || 0,
      rifornimento_euro: parseFloat(rifornimento_euro) || 0,
      metodo_rifornimento: metodo_rifornimento || null,
      numero_scheda_dkv: numero_scheda_dkv || null
    };

    Report.completeReturn(reportId, returnData, (err) => {
      if (err) {
        console.error(err);
        logActivity(req.session.userId, 'REPORT_COMPLETE_ERROR', `Errore completamento report ${reportId}`, req);
        req.flash('error', 'Errore durante il completamento del rientro');
        req.session.save((saveErr) => {
          if (saveErr) console.error('Errore save session:', saveErr);
          return res.redirect('/rider/dashboard');
        });
        return;
      }

      const kmPercorsi = parseInt(km_rientro) - parseInt(report.km_partenza);
      logActivity(req.session.userId, 'REPORT_COMPLETATO', `Rientro completato per ${report.data_giorno} - KM percorsi: ${kmPercorsi}`, req);
      req.flash('success', `✅ Rientro completato! KM percorsi: ${kmPercorsi}`);
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        res.redirect('/rider/dashboard');
      });
    });
  });
});

// Richiesta manutenzione con AI priority detection
router.post('/maintenance/create', requireRider, (req, res) => {
  const { vehicle_id, issue_description, priority: manualPriority } = req.body;

  if (!vehicle_id || !issue_description) {
    req.flash('error', 'Compila tutti i campi obbligatori');
    return res.redirect('/rider/dashboard');
  }

  // AI: Rileva automaticamente la priorità
  const aiDetection = detectPriorityWithExplanation(issue_description);
  
  // Usa priorità AI se non specificata manualmente, altrimenti rispetta scelta utente
  const finalPriority = manualPriority || aiDetection.priority;

  const maintenanceData = {
    vehicle_id: parseInt(vehicle_id),
    reporter_id: req.session.userId,
    issue_description,
    priority: finalPriority
  };

  Maintenance.create(maintenanceData, (err) => {
    if (err) {
      console.error('Error creating maintenance request:', err);
      req.flash('error', 'Errore durante la creazione della richiesta');
      return res.redirect('/rider/dashboard');
    }

    // Log con info AI
    const aiInfo = manualPriority 
      ? `Priorità manuale: ${manualPriority}` 
      : `AI: ${aiDetection.priority} (${aiDetection.confidence}% - ${aiDetection.explanation})`;
    
    logActivity(
      req.session.userId, 
      'MAINTENANCE_CREATED', 
      `Richiesta manutenzione per furgone ${vehicle_id} | ${aiInfo}`, 
      req
    );
    
    // Flash message con info AI
    let successMsg = '🔧 Richiesta manutenzione inviata con successo!';
    if (!manualPriority) {
      successMsg += ` | 🤖 AI: Priorità ${aiDetection.priority.toUpperCase()} rilevata automaticamente`;
    }
    
    req.flash('success', successMsg);
    res.redirect('/rider/dashboard');
  });
});

// API: Preview priorità in tempo reale (per AJAX)
router.post('/maintenance/preview-priority', requireRider, (req, res) => {
  const { issue_description } = req.body;
  
  if (!issue_description) {
    return res.json({ priority: 'media', confidence: 0, explanation: 'Nessuna descrizione' });
  }

  const aiDetection = detectPriorityWithExplanation(issue_description);
  res.json(aiDetection);
});

module.exports = router;

