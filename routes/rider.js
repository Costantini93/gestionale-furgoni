const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireRider } = require('../middleware/auth');
const Report = require('../models/Report');
const logActivity = require('../middleware/logger');

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
  // Ottieni i report del rider
  Report.getByUserId(req.session.userId, (err, reports) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Errore del server');
    }

    const successMessages = req.flash('success');
    const errorMessages = req.flash('error');
    console.log('📬 Flash messages nella GET:', { success: successMessages, error: errorMessages });

    res.render('rider/dashboard', {
      user: {
        id: req.session.userId,
        username: req.session.username,
        nome: req.session.nome,
        cognome: req.session.cognome
      },
      reports: reports || [],
      success: successMessages,
      error: errorMessages
    });
  });
});

// Crea nuovo report con foto
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
    km_rientro,
    orario_rientro,
    numero_scheda_dkv,
    importo_rifornimento,
    numero_aziendale,
    pacchi_resi,
    firma
  } = req.body;

  // Validazione base
  if (!data_giorno || !targa_furgone || !codice_rotta || !km_partenza || 
      !km_rientro || !orario_rientro || !firma) {
    req.flash('error', 'Compila tutti i campi obbligatori');
    req.session.save((saveErr) => {
      if (saveErr) console.error('Errore save session:', saveErr);
      return res.redirect('/rider/dashboard');
    });
    return;
  }

  // Verifica se esiste già un report per questo giorno
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
      req.flash('error', `Hai già inserito i dati per il ${data_giorno}. Non puoi inserire dati duplicati per la stessa data.`);
      console.log('📮 Flash impostato. Contenuto sessione prima del save:', req.session.flash);
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        console.log('💾 Sessione salvata. Contenuto:', req.session.flash);
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

    // Crea il report
    const reportData = {
      user_id: req.session.userId,
      data_giorno,
      targa_furgone,
      codice_rotta,
      km_partenza,
      km_rientro,
      orario_rientro,
      numero_scheda_dkv: numero_scheda_dkv || null,
      importo_rifornimento: importo_rifornimento || null,
      numero_aziendale: numero_aziendale || null,
      pacchi_resi: pacchi_resi || null,
      firma: firma === 'on' ? 1 : 0,
      foto_posteriore,
      foto_anteriore,
      foto_lato_destro,
      foto_lato_sinistro,
      foto_interno
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

      logActivity(req.session.userId, 'REPORT_CREATE', `Report creato per ${data_giorno} - Targa: ${targa_furgone}, Rotta: ${codice_rotta}`, req);
      req.flash('success', 'Dati giornalieri salvati con successo!');
      req.session.save((saveErr) => {
        if (saveErr) console.error('Errore save session:', saveErr);
        res.redirect('/rider/dashboard');
      });
    });
  });
});

module.exports = router;
