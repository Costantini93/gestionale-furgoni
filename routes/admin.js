const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');

// Dashboard admin con ricerca avanzata
router.get('/dashboard', requireAdmin, (req, res) => {
  console.log('Admin dashboard accessed by:', req.session.username);
  let { rider, data, rotta, targa } = req.query;

  // Converti data italiana (GG/MM/AAAA) in formato SQL (YYYY-MM-DD) se necessario
  if (data && data.includes('/')) {
    const parts = data.split('/');
    if (parts.length === 3) {
      data = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD per query
    }
  }

  try {
    Report.getAll((err, allReports) => {
      if (err) {
        console.error('Error getting reports:', err);
        return res.status(500).send('Errore del server - reports');
      }

      console.log('Reports fetched:', allReports ? allReports.length : 0);

      // Applica i filtri
      let filteredReports = allReports || [];

      if (rider) {
        filteredReports = filteredReports.filter(r => r.user_id == rider);
      }

      if (data) {
        filteredReports = filteredReports.filter(r => r.data_giorno === data);
      }

      if (rotta) {
        filteredReports = filteredReports.filter(r => 
          r.codice_rotta && r.codice_rotta.toLowerCase().includes(rotta.toLowerCase())
        );
      }

      if (targa) {
        filteredReports = filteredReports.filter(r => 
          r.targa_furgone && r.targa_furgone.toLowerCase().includes(targa.toLowerCase())
        );
      }

      User.getAllRiders((err, riders) => {
        if (err) {
          console.error('Error getting riders:', err);
          return res.status(500).send('Errore del server - riders');
        }

        console.log('Riders fetched:', riders ? riders.length : 0);

        res.render('admin/dashboard', {
          user: {
            nome: req.session.nome,
            cognome: req.session.cognome
          },
          reports: filteredReports,
          riders: riders || [],
          selectedRider: rider || null,
          searchFilters: { rider, data: req.query.data, rotta, targa },
          success: req.flash('success'),
          error: req.flash('error')
        });
      });
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Errore del server: ' + error.message);
  }
});

// Filtra per rider
router.get('/reports/rider/:userId', requireAdmin, (req, res) => {
  const userId = req.params.userId;

  Report.getByUserId(userId, (err, reports) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Errore del server');
    }

    User.getAllRiders((err, riders) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Errore del server');
      }

      res.render('admin/dashboard', {
        user: {
          nome: req.session.nome,
          cognome: req.session.cognome
        },
        reports: reports || [],
        riders: riders || [],
        selectedRider: userId,
        success: req.flash('success'),
        error: req.flash('error')
      });
    });
  });
});

// Aggiorna report
router.post('/report/update/:reportId', requireAdmin, (req, res) => {
  const reportId = req.params.reportId;
  const {
    targa_furgone,
    codice_rotta,
    km_partenza,
    km_rientro,
    orario_rientro,
    numero_scheda_dkv,
    importo_rifornimento,
    numero_aziendale,
    pacchi_resi,
    current_status
  } = req.body;

  // Determina il nuovo status
  let newStatus = current_status || 'completato';
  
  // Se km_rientro e orario_rientro sono presenti, status diventa 'completato'
  if (km_rientro && orario_rientro) {
    newStatus = 'completato';
  } else if (current_status === 'partito') {
    // Se era in viaggio e non sono stati inseriti i dati, rimane in viaggio
    newStatus = 'partito';
  }

  const reportData = {
    targa_furgone,
    codice_rotta,
    km_partenza,
    km_rientro: km_rientro || null,
    orario_rientro: orario_rientro || null,
    numero_scheda_dkv: numero_scheda_dkv || null,
    importo_rifornimento: importo_rifornimento || null,
    numero_aziendale: numero_aziendale || null,
    pacchi_resi: pacchi_resi || null,
    status: newStatus
  };

  Report.update(reportId, reportData, (err) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore durante l\'aggiornamento');
      return res.redirect('/admin/dashboard');
    }

    const statusMsg = newStatus === 'completato' ? ' e status aggiornato a "Rientrato"' : '';
    req.flash('success', `Report aggiornato con successo${statusMsg}!`);
    res.redirect('/admin/dashboard');
  });
});

// Elimina report
router.post('/report/delete/:reportId', requireAdmin, (req, res) => {
  const reportId = req.params.reportId;

  Report.delete(reportId, (err) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore durante l\'eliminazione');
      return res.redirect('/admin/dashboard');
    }

    req.flash('success', 'Report eliminato con successo!');
    res.redirect('/admin/dashboard');
  });
});

// Elimina report multipli
router.post('/report/delete-multiple', requireAdmin, (req, res) => {
  const reportIds = req.body['reportIds[]'];
  
  if (!reportIds || reportIds.length === 0) {
    req.flash('error', 'Nessun report selezionato');
    return res.redirect('/admin/dashboard');
  }

  // Converti a array se è un singolo valore
  const ids = Array.isArray(reportIds) ? reportIds : [reportIds];
  
  let deletedCount = 0;
  let errors = 0;

  // Elimina ogni report
  ids.forEach((id, index) => {
    Report.delete(id, (err) => {
      if (err) {
        console.error(`Errore eliminazione report ${id}:`, err);
        errors++;
      } else {
        deletedCount++;
      }

      // Quando abbiamo processato tutti, redirect
      if (index === ids.length - 1) {
        if (errors > 0) {
          req.flash('error', `${deletedCount} report eliminati, ${errors} errori`);
        } else {
          req.flash('success', `${deletedCount} report eliminati con successo!`);
        }
        res.redirect('/admin/dashboard');
      }
    });
  });
});

// Esporta in Excel
router.get('/export', requireAdmin, (req, res) => {
  const riderId = req.query.rider;

  const getReports = riderId 
    ? (callback) => Report.getByUserId(riderId, callback)
    : (callback) => Report.getAll(callback);

  getReports(async (err, reports) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore durante l\'esportazione');
      return res.redirect('/admin/dashboard');
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report Consegne');

      // Intestazioni
      worksheet.columns = [
        { header: 'Data', key: 'data_giorno', width: 12 },
        { header: 'Nome', key: 'nome', width: 15 },
        { header: 'Cognome', key: 'cognome', width: 15 },
        { header: 'Targa Furgone', key: 'targa_furgone', width: 15 },
        { header: 'Codice Rotta', key: 'codice_rotta', width: 15 },
        { header: 'Km Partenza', key: 'km_partenza', width: 12 },
        { header: 'Km Rientro', key: 'km_rientro', width: 12 },
        { header: 'Km Percorsi', key: 'km_percorsi', width: 12 },
        { header: 'Orario Rientro', key: 'orario_rientro', width: 15 },
        { header: 'Scheda DKV', key: 'numero_scheda_dkv', width: 15 },
        { header: 'Importo Rifornimento', key: 'importo_rifornimento', width: 18 },
        { header: 'Numero Aziendale', key: 'numero_aziendale', width: 18 },
        { header: 'Pacchi Resi', key: 'pacchi_resi', width: 12 },
        { header: 'Firma', key: 'firma', width: 10 }
      ];

      // Stile intestazioni
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      // Aggiungi dati
      reports.forEach(report => {
        worksheet.addRow({
          data_giorno: report.data_giorno,
          nome: report.nome,
          cognome: report.cognome,
          targa_furgone: report.targa_furgone,
          codice_rotta: report.codice_rotta,
          km_partenza: report.km_partenza,
          km_rientro: report.km_rientro,
          km_percorsi: report.km_rientro - report.km_partenza,
          orario_rientro: report.orario_rientro,
          numero_scheda_dkv: report.numero_scheda_dkv || '',
          importo_rifornimento: report.importo_rifornimento || '',
          numero_aziendale: report.numero_aziendale || '',
          pacchi_resi: report.pacchi_resi || '',
          firma: report.firma ? 'Sì' : 'No'
        });
      });

      // Imposta il nome del file
      const filename = riderId 
        ? `report_rider_${riderId}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `report_tutti_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(error);
      req.flash('error', 'Errore durante la creazione del file Excel');
      res.redirect('/admin/dashboard');
    }
  });
});

// ========== GESTIONE DIPENDENTI (RIDER) ==========

// Pagina gestione dipendenti
router.get('/dipendenti', requireAdmin, (req, res) => {
  // Ottieni tutti gli utenti (rider e admin)
  const db = require('../config/database');
  db.all('SELECT id, username, nome, cognome, codice_fiscale, role, created_at FROM users ORDER BY role, cognome, nome', (err, users) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Errore del server');
    }

    res.render('admin/dipendenti', {
      user: {
        nome: req.session.nome,
        cognome: req.session.cognome
      },
      riders: users || [],
      success: req.flash('success'),
      error: req.flash('error')
    });
  });
});

// Crea nuovo rider
router.post('/dipendenti/create', requireAdmin, async (req, res) => {
  const { nome, cognome, username, codice_fiscale, is_admin } = req.body;

  if (!nome || !cognome || !username || !codice_fiscale) {
    req.flash('error', 'Compila tutti i campi obbligatori');
    return res.redirect('/admin/dipendenti');
  }

  // Determina il ruolo
  const role = is_admin === 'on' ? 'admin' : 'rider';

  // Valida formato codice fiscale (16 caratteri alfanumerici)
  const cfUpper = codice_fiscale.toUpperCase().trim();
  if (!/^[A-Z0-9]{16}$/.test(cfUpper)) {
    req.flash('error', 'Codice fiscale non valido. Deve contenere esattamente 16 caratteri alfanumerici.');
    return res.redirect('/admin/dipendenti');
  }

  // Verifica che il codice fiscale non esista già
  User.findByCodiceFiscale(cfUpper, (err, existingUser) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore del server');
      return res.redirect('/admin/dipendenti');
    }

    if (existingUser) {
      req.flash('error', `Codice fiscale già registrato per: ${existingUser.nome} ${existingUser.cognome}`);
      return res.redirect('/admin/dipendenti');
    }

    // Funzione per trovare uno username disponibile
    const findAvailableUsername = (baseUsername, callback) => {
      User.findSimilarUsernames(baseUsername, (err, similarUsers) => {
        if (err) {
          return callback(err, null);
        }

        // Se non ci sono username simili, usa quello base
        if (!similarUsers || similarUsers.length === 0) {
          return callback(null, baseUsername);
        }

        // Trova il numero più alto già usato
        const existingUsernames = similarUsers.map(u => u.username);
        let maxNumber = 0;

        existingUsernames.forEach(existingUsername => {
          if (existingUsername === baseUsername) {
            maxNumber = Math.max(maxNumber, 1);
          } else {
            // Cerca pattern nome_cognome2, nome_cognome3, etc.
            const match = existingUsername.match(new RegExp(`^${baseUsername}(\\d+)$`));
            if (match) {
              maxNumber = Math.max(maxNumber, parseInt(match[1]));
            }
          }
        });

        // Se esiste già nome_cognome, usa nome_cognome2
        const finalUsername = maxNumber > 0 ? baseUsername + (maxNumber + 1) : baseUsername;
        callback(null, finalUsername);
      });
    };

    // Trova username disponibile
    findAvailableUsername(username, async (err, availableUsername) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore del server');
        return res.redirect('/admin/dipendenti');
      }

      try {
        // Password di default: 1234
        const hashedPassword = await bcrypt.hash('1234', 10);
        
        const userData = {
          username: availableUsername,
          password: hashedPassword,
          nome,
          cognome,
          codice_fiscale: cfUpper,
          role: role
        };

        User.create(userData, (err) => {
          if (err) {
            console.error(err);
            req.flash('error', 'Errore durante la creazione dell\'utente');
            return res.redirect('/admin/dipendenti');
          }

          const roleText = role === 'admin' ? 'Amministratore' : 'Rider';
          const message = availableUsername !== username 
            ? `${roleText} ${nome} ${cognome} creato con successo! Username assegnato: ${availableUsername} (modificato per evitare duplicati), Password: 1234`
            : `${roleText} ${nome} ${cognome} creato con successo! Username: ${availableUsername}, Password: 1234`;
          
          req.flash('success', message);
          res.redirect('/admin/dipendenti');
        });
      } catch (error) {
        console.error(error);
        req.flash('error', 'Errore durante la creazione del rider');
        res.redirect('/admin/dipendenti');
      }
    });
  });
});

// Aggiorna rider
router.post('/dipendenti/update/:userId', requireAdmin, (req, res) => {
  const userId = req.params.userId;
  const { nome, cognome, username, codice_fiscale, is_admin } = req.body;

  if (!nome || !cognome || !username || !codice_fiscale) {
    req.flash('error', 'Compila tutti i campi obbligatori');
    return res.redirect('/admin/dipendenti');
  }

  // Determina il ruolo
  const role = is_admin === 'on' ? 'admin' : 'rider';

  // Valida formato codice fiscale
  const cfUpper = codice_fiscale.toUpperCase().trim();
  if (!/^[A-Z0-9]{16}$/.test(cfUpper)) {
    req.flash('error', 'Codice fiscale non valido. Deve contenere esattamente 16 caratteri alfanumerici.');
    return res.redirect('/admin/dipendenti');
  }

  // Verifica che il codice fiscale non sia già usato da altri
  User.findByCodiceFiscale(cfUpper, (err, existingUser) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore del server');
      return res.redirect('/admin/dipendenti');
    }

    if (existingUser && existingUser.id != userId) {
      req.flash('error', `Codice fiscale già registrato per: ${existingUser.nome} ${existingUser.cognome}`);
      return res.redirect('/admin/dipendenti');
    }

    // Funzione per trovare uno username disponibile (escludendo l'utente corrente)
    const findAvailableUsername = (baseUsername, currentUserId, callback) => {
      User.findSimilarUsernames(baseUsername, (err, similarUsers) => {
        if (err) {
          return callback(err, null);
        }

        // Se non ci sono conflitti, usa quello base
        User.findByUsername(baseUsername, (err, existingUser) => {
          if (err) {
            return callback(err, null);
          }

          // Se non esiste o è l'utente stesso, ok
          if (!existingUser || existingUser.id == currentUserId) {
            return callback(null, baseUsername);
          }

          // Altrimenti trova un numero disponibile
          let maxNumber = 0;
          similarUsers.forEach(user => {
            if (user.username === baseUsername) {
              maxNumber = Math.max(maxNumber, 1);
            } else {
              const match = user.username.match(new RegExp(`^${baseUsername}(\\d+)$`));
              if (match) {
                maxNumber = Math.max(maxNumber, parseInt(match[1]));
              }
            }
          });

          const finalUsername = baseUsername + (maxNumber + 1);
          callback(null, finalUsername);
        });
      });
    };

    findAvailableUsername(username, userId, (err, availableUsername) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore del server');
        return res.redirect('/admin/dipendenti');
      }

      const db = require('../config/database');
      db.run(
        'UPDATE users SET nome = ?, cognome = ?, username = ?, codice_fiscale = ?, role = ? WHERE id = ?',
        [nome, cognome, availableUsername, cfUpper, role, userId],
        (err) => {
          if (err) {
            console.error(err);
            req.flash('error', 'Errore durante l\'aggiornamento');
            return res.redirect('/admin/dipendenti');
          }

          const roleText = role === 'admin' ? 'Amministratore' : 'Rider';
          const message = availableUsername !== username
            ? `Utente aggiornato come ${roleText}! Username assegnato: ${availableUsername} (modificato per evitare duplicati)`
            : `Utente aggiornato con successo come ${roleText}!`;

          req.flash('success', message);
          res.redirect('/admin/dipendenti');
        }
      );
    });
  });
});

// Resetta password rider
router.post('/dipendenti/reset-password/:userId', requireAdmin, async (req, res) => {
  const userId = req.params.userId;

  // Non permettere di resettare la propria password
  if (userId == req.session.userId) {
    req.flash('error', 'Non puoi resettare la tua password da qui. Usa il cambio password.');
    return res.redirect('/admin/dipendenti');
  }

  try {
    const hashedPassword = await bcrypt.hash('1234', 10);
    const db = require('../config/database');
    
    db.run(
      'UPDATE users SET password = ?, first_login = 1 WHERE id = ?',
      [hashedPassword, userId],
      (err) => {
        if (err) {
          console.error(err);
          req.flash('error', 'Errore durante il reset della password');
          return res.redirect('/admin/dipendenti');
        }

        req.flash('success', 'Password resettata a 1234. L\'utente dovrà cambiarla al prossimo accesso.');
        res.redirect('/admin/dipendenti');
      }
    );
  } catch (error) {
    console.error(error);
    req.flash('error', 'Errore durante il reset della password');
    res.redirect('/admin/dipendenti');
  }
});

// Elimina rider
router.post('/dipendenti/delete/:userId', requireAdmin, (req, res) => {
  const userId = req.params.userId;
  const db = require('../config/database');

  // Verifica che non sia l'utente corrente
  if (userId == req.session.userId) {
    req.flash('error', 'Non puoi eliminare il tuo account mentre sei connesso!');
    return res.redirect('/admin/dipendenti');
  }

  // Prima elimina tutti i report del rider
  db.run('DELETE FROM daily_reports WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore durante l\'eliminazione');
      return res.redirect('/admin/dipendenti');
    }

    // Poi elimina l'utente
    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore durante l\'eliminazione');
        return res.redirect('/admin/dipendenti');
      }

      req.flash('success', 'Utente eliminato con successo!');
      res.redirect('/admin/dipendenti');
    });
  });
});

module.exports = router;
