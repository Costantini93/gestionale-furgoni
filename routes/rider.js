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

      // Ottieni furgone assegnato
      Assignment.getByRider(req.session.userId, (err3, assignment) => {
        if (err3) console.error('Error getting assignment:', err3);

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
          assignment: assignment || null,
          success: successMessages,
          error: errorMessages
        });
      });
    });
  });
});

// Crea nuovo report (SOLO PARTENZA)
router.post('/report/create', requireRider, upload.fields([
  { name: 'foto_posteriore', maxCount: 1 },
  { name: 'foto_anteriore', maxCount: 1 },
  { name: 'foto_lato_destro', maxCount: 1 },
  { name: 'foto_lato_sinistro', maxCount: 1 },
  { name: 'foto_interno', maxCount: 1 }
]), (req, res) => {
  const {
    data_giorno,
    targa_furgone,
    codice_rotta,
    km_partenza,
    numero_scheda_dkv,
    importo_rifornimento,
    numero_aziendale,
    pacchi_resi,
    firma
  } = req.body;

  // Validazione base (solo campi partenza)
  if (!data_giorno || !targa_furgone || !codice_rotta || !km_partenza || !firma) {
    req.flash('error', 'Compila tutti i campi obbligatori per la partenza');
    req.session.save((saveErr) => {
      if (saveErr) console.error('Errore save session:', saveErr);
      return res.redirect('/rider/dashboard');
    });
    return;
  }

  // Verifica se esiste già un report PARTITO per questo giorno
  Report.checkExisting(req.session.userId, data_giorno, (err, existing) => {
    if (err) {
      console.error('Errore checkExisting:', err);
      req.flash('error', 'Errore del server');
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        return res.redirect('/rider/dashboard');
      });
      return;
    }

    if (existing) {
      console.log(`⚠️ Tentativo di duplicato - User: ${req.session.userId}, Data: ${data_giorno}`);
      req.flash('error', `Hai già registrato una partenza per il ${data_giorno}. Completa prima il rientro.`);
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

    // Crea il report con status 'partito' (km_rientro e orario_rientro = NULL)
    const reportData = {
      user_id: req.session.userId,
      data_giorno,
      targa_furgone,
      codice_rotta,
      km_partenza,
      km_rientro: null,
      orario_rientro: null,
      numero_scheda_dkv: numero_scheda_dkv || null,
      importo_rifornimento: importo_rifornimento || null,
      numero_aziendale: numero_aziendale || null,
      pacchi_resi: pacchi_resi || null,
      firma: firma === 'on' ? 1 : 0,
      foto_posteriore,
      foto_anteriore,
      foto_lato_destro,
      foto_lato_sinistro,
      foto_interno,
      status: 'partito'
    };

    Report.create(reportData, (err) => {
      if (err) {
        console.error(err);
        logActivity(req.session.userId, 'REPORT_CREATE_ERROR', `Errore creazione report per ${data_giorno}`, req);
        req.flash('error', 'Errore durante il salvataggio dei dati');
        req.session.save((saveErr) => {
          if (saveErr) console.error('Errore save session:', saveErr);
          return res.redirect('/rider/dashboard');
        });
        return;
      }

      logActivity(req.session.userId, 'REPORT_PARTENZA', `Partenza registrata per ${data_giorno} - Targa: ${targa_furgone}, Rotta: ${codice_rotta}, KM: ${km_partenza}`, req);
      req.flash('success', '🚚 Partenza registrata! Buon viaggio! Ricorda di completare il rientro.');
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        res.redirect('/rider/dashboard');
      });
    });
  });
});

// Completa rientro
router.post('/report/complete/:id', requireRider, (req, res) => {
  const reportId = req.params.id;
  const { km_rientro, orario_rientro, pacchi_ritornati, rifornimento_euro } = req.body;

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
      rifornimento_euro: parseFloat(rifornimento_euro) || 0
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

