const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');
const { Vehicle, Assignment, Maintenance } = require('../models/Vehicle');

// Helper per contare manutenzioni pending
function getPendingMaintenanceCount(callback) {
  const db = require('../config/database');
  db.get('SELECT COUNT(*) as count FROM maintenance_requests WHERE status = ?', ['pending'], (err, row) => {
    if (err) {
      console.error('Error counting pending maintenance:', err);
      return callback(null, 0);
    }
    callback(null, row ? row.count : 0);
  });
}

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

        // Ottieni stato furgoni con assegnamenti correnti
        Vehicle.getAllWithAssignments((err, vehicles) => {
          if (err) {
            console.error('Error getting vehicles:', err);
            vehicles = [];
          }

          // Conta manutenzioni pending
          getPendingMaintenanceCount((err, pendingMaintenanceCount) => {
            res.render('admin/dashboard', {
              user: {
                nome: req.session.nome,
                cognome: req.session.cognome
              },
              reports: filteredReports,
              riders: riders || [],
              vehicles: vehicles || [],
              selectedRider: rider || null,
              searchFilters: { rider, data: req.query.data, rotta, targa },
              pendingMaintenanceCount: pendingMaintenanceCount || 0,
              success: req.flash('success'),
              error: req.flash('error')
            });
          });
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
  // Express può ricevere l'array in diversi formati
  const reportIds = req.body.reportIds || req.body['reportIds[]'] || [];
  
  console.log('Body ricevuto:', req.body);
  console.log('Report IDs:', reportIds);
  
  if (!reportIds || reportIds.length === 0) {
    req.flash('error', 'Nessun report selezionato');
    return res.redirect('/admin/dashboard');
  }

  // Converti a array se è un singolo valore
  const ids = Array.isArray(reportIds) ? reportIds : [reportIds];
  
  console.log('IDs da eliminare:', ids);
  
  let deletedCount = 0;
  let errors = 0;
  let completed = 0;

  // Elimina ogni report
  ids.forEach((id) => {
    Report.delete(id, (err) => {
      completed++;
      
      if (err) {
        console.error(`Errore eliminazione report ${id}:`, err);
        errors++;
      } else {
        deletedCount++;
      }

      // Quando abbiamo processato tutti, redirect
      if (completed === ids.length) {
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
  db.all('SELECT id, username, nome, cognome, codice_fiscale, role, fixed_vehicle_id, is_active, created_at FROM users ORDER BY role, cognome, nome', (err, users) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Errore del server');
    }

    // Ottieni tutti i veicoli per il dropdown
    Vehicle.getAll((err, vehicles) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Errore del server');
      }

      // Conta manutenzioni pending
      getPendingMaintenanceCount((err, pendingMaintenanceCount) => {
        res.render('admin/dipendenti', {
          user: {
            nome: req.session.nome,
            cognome: req.session.cognome
          },
          riders: users || [],
          vehicles: vehicles || [],
          pendingMaintenanceCount: pendingMaintenanceCount || 0,
          success: req.flash('success'),
          error: req.flash('error')
        });
      });
    });
  });
});

// Crea nuovo rider
router.post('/dipendenti/create', requireAdmin, async (req, res) => {
  const { nome, cognome, username, codice_fiscale, role, fixed_vehicle_id, password, is_active } = req.body;

  if (!nome || !cognome || !username || !codice_fiscale) {
    req.flash('error', 'Compila tutti i campi obbligatori');
    return res.redirect('/admin/dipendenti');
  }

  // Valida formato email per username
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    req.flash('error', 'Inserisci un indirizzo email valido');
    return res.redirect('/admin/dipendenti');
  }

  // Valida formato codice fiscale (16 caratteri alfanumerici)
  const cfUpper = codice_fiscale.toUpperCase().trim();
  if (!/^[A-Z0-9]{16}$/.test(cfUpper)) {
    req.flash('error', 'Codice fiscale non valido. Deve contenere esattamente 16 caratteri alfanumerici.');
    return res.redirect('/admin/dipendenti');
  }

  // Verifica che l'email non esista già
  const db = require('../config/database');
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore del server');
      return res.redirect('/admin/dipendenti');
    }

    if (existingUser) {
      req.flash('error', 'Email già registrata');
      return res.redirect('/admin/dipendenti');
    }

    // Verifica che il codice fiscale non esista già
    User.findByCodiceFiscale(cfUpper, async (err, existingCF) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore del server');
        return res.redirect('/admin/dipendenti');
      }

      if (existingCF) {
        req.flash('error', `Codice fiscale già registrato per: ${existingCF.nome} ${existingCF.cognome}`);
        return res.redirect('/admin/dipendenti');
      }

      try {
        // Password predefinita: 1234 (o quella passata dal form)
        const passwordToUse = password || '1234';
        const hashedPassword = await bcrypt.hash(passwordToUse, 10);
        
        const userData = {
          username: username,
          password: hashedPassword,
          nome,
          cognome,
          codice_fiscale: cfUpper,
          role: role || 'rider',
          fixed_vehicle_id: fixed_vehicle_id || null,
          is_active: is_active === '1' ? 1 : 0
        };

        User.create(userData, (err) => {
          if (err) {
            console.error(err);
            req.flash('error', 'Errore durante la creazione dell\'utente');
            return res.redirect('/admin/dipendenti');
          }

          const roleText = role === 'admin' ? 'Amministratore' : 'Driver';
          req.flash('success', `${roleText} ${nome} ${cognome} creato con successo! Email: ${username}, Password: ${passwordToUse}`);
          res.redirect('/admin/dipendenti');
        });
      } catch (error) {
        console.error(error);
        req.flash('error', 'Errore durante la creazione del driver');
        res.redirect('/admin/dipendenti');
      }
    });
  });
});

// Aggiorna rider
router.post('/dipendenti/update/:userId', requireAdmin, (req, res) => {
  const userId = req.params.userId;
  const { nome, cognome, username, codice_fiscale, role, fixed_vehicle_id, is_active } = req.body;

  console.log('=== UPDATE DRIVER ===');
  console.log('User ID:', userId);
  console.log('Body received:', req.body);
  console.log('Role value:', role);
  console.log('Is Active:', is_active);
  console.log('====================');

  if (!nome || !cognome || !username || !codice_fiscale) {
    req.flash('error', 'Compila tutti i campi obbligatori');
    return res.redirect('/admin/dipendenti');
  }

  // Valida formato email per username
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    req.flash('error', 'Inserisci un indirizzo email valido');
    return res.redirect('/admin/dipendenti');
  }

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

    // Verifica che l'email non sia già usata da altri
    const db = require('../config/database');
    db.get('SELECT * FROM users WHERE username = ? AND id != ?', [username, userId], (err, existingEmail) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore del server');
        return res.redirect('/admin/dipendenti');
      }

      if (existingEmail) {
        req.flash('error', 'Email già registrata da un altro utente');
        return res.redirect('/admin/dipendenti');
      }

      // Aggiorna l'utente
      db.run(
        'UPDATE users SET nome = ?, cognome = ?, username = ?, codice_fiscale = ?, role = ?, fixed_vehicle_id = ?, is_active = ? WHERE id = ?',
        [nome, cognome, username, cfUpper, role || 'rider', fixed_vehicle_id || null, is_active === '1' ? 1 : 0, userId],
        (err) => {
          if (err) {
            console.error(err);
            req.flash('error', 'Errore durante l\'aggiornamento');
            return res.redirect('/admin/dipendenti');
          }

          const roleText = role === 'admin' ? 'Amministratore' : 'Driver';
          req.flash('success', `${nome} ${cognome} aggiornato con successo come ${roleText}!`);
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

// Export Excel
router.get('/report/export', requireAdmin, (req, res) => {
  let { rider, data, rotta, targa } = req.query;

  if (data && data.includes('/')) {
    const parts = data.split('/');
    if (parts.length === 3) {
      data = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  Report.getAll(async (err, allReports) => {
    if (err) {
      console.error('Export error:', err);
      return res.status(500).send('Errore export');
    }

    let reports = allReports || [];

    // Applica gli stessi filtri della dashboard
    if (rider) reports = reports.filter(r => r.user_id == rider);
    if (data) reports = reports.filter(r => r.data_giorno === data);
    if (rotta) reports = reports.filter(r => r.codice_rotta && r.codice_rotta.toLowerCase().includes(rotta.toLowerCase()));
    if (targa) reports = reports.filter(r => r.targa_furgone && r.targa_furgone.toLowerCase().includes(targa.toLowerCase()));

    // Crea workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report Furgoni');

    // HEADER con logo e info
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = '🚚 GESTIONALE FURGONI - REPORT VIAGGI';
    worksheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF6366F1' } };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = `Esportato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`;
    worksheet.getCell('A2').font = { size: 11, italic: true, color: { argb: 'FF94A3B8' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Colonne
    worksheet.columns = [
      { header: 'Rider', key: 'rider', width: 20 },
      { header: 'Data', key: 'data', width: 12 },
      { header: 'Rotta', key: 'rotta', width: 15 },
      { header: 'Targa', key: 'targa', width: 12 },
      { header: 'KM Partenza', key: 'km_partenza', width: 14 },
      { header: 'KM Rientro', key: 'km_rientro', width: 14 },
      { header: 'KM Percorsi', key: 'km_percorsi', width: 14 },
      { header: 'Orario Partenza', key: 'orario_partenza', width: 16 },
      { header: 'Orario Rientro', key: 'orario_rientro', width: 16 },
      { header: 'Stato', key: 'status', width: 12 }
    ];

    // Stile header
    const headerRow = worksheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Dati
    reports.forEach(report => {
      const kmPercorsi = (report.km_rientro && report.km_partenza) 
        ? (report.km_rientro - report.km_partenza) 
        : '-';

      worksheet.addRow({
        rider: report.username || '-',
        data: report.data_giorno || '-',
        rotta: report.codice_rotta || '-',
        targa: report.targa_furgone || '-',
        km_partenza: report.km_partenza || '-',
        km_rientro: report.km_rientro || '-',
        km_percorsi: kmPercorsi,
        orario_partenza: report.orario_partenza || '-',
        orario_rientro: report.orario_rientro || '-',
        status: report.status === 'partito' ? '🚚 In Viaggio' : '✅ Rientrato'
      });
    });

    // Bordi e stile celle dati
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 4) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Colora righe alternate
        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          });
        }
      }
    });

    // Riga totali
    const totalRow = worksheet.addRow({});
    totalRow.getCell(1).value = 'TOTALE REPORT';
    totalRow.getCell(1).font = { bold: true, size: 12 };
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 6);
    totalRow.getCell(7).value = reports.length;
    totalRow.getCell(7).font = { bold: true, size: 12, color: { argb: 'FF6366F1' } };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' }
    };

    // Invia file
    const filename = `report-furgoni-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  });
});

// ===== GESTIONE FURGONI =====
router.get('/vehicles', requireAdmin, (req, res) => {
  Vehicle.getAll((err, vehicles) => {
    if (err) {
      console.error('Error getting vehicles:', err);
      req.flash('error', 'Errore nel caricamento dei veicoli');
      return res.redirect('/admin/dashboard');
    }

    // Conta manutenzioni pending
    getPendingMaintenanceCount((err, pendingMaintenanceCount) => {
      res.render('admin/vehicles', {
        user: req.session,
        vehicles: vehicles || [],
        pendingMaintenanceCount: pendingMaintenanceCount || 0,
        success: req.flash('success'),
        error: req.flash('error')
      });
    });
  });
});

// Aggiungi nuovo veicolo
router.post('/vehicles/create', requireAdmin, (req, res) => {
  const { targa, modello, anno } = req.body;

  if (!targa || !modello || !anno) {
    req.flash('error', 'Tutti i campi sono obbligatori');
    return res.redirect('/admin/vehicles');
  }

  Vehicle.create({ targa, modello, anno, status: 'disponibile' }, (err) => {
    if (err) {
      console.error('Error creating vehicle:', err);
      req.flash('error', 'Errore nella creazione del veicolo');
      return res.redirect('/admin/vehicles');
    }

    req.flash('success', 'Veicolo aggiunto con successo');
    res.redirect('/admin/vehicles');
  });
});

// Elimina veicolo
router.post('/vehicles/delete/:id', requireAdmin, (req, res) => {
  const vehicleId = req.params.id;

  // Verifica se il veicolo è assegnato
  Assignment.getActiveByVehicleId(vehicleId, (err, assignment) => {
    if (err) {
      console.error('Error checking assignment:', err);
      req.flash('error', 'Errore nella verifica degli assegnamenti');
      return res.redirect('/admin/vehicles');
    }

    if (assignment) {
      req.flash('error', 'Impossibile eliminare: veicolo attualmente assegnato');
      return res.redirect('/admin/vehicles');
    }

    Vehicle.delete(vehicleId, (err) => {
      if (err) {
        console.error('Error deleting vehicle:', err);
        req.flash('error', 'Errore nell\'eliminazione del veicolo');
        return res.redirect('/admin/vehicles');
      }

      req.flash('success', 'Veicolo eliminato con successo');
      res.redirect('/admin/vehicles');
    });
  });
});

// ===== VEHICLE ASSIGNMENTS =====
router.get('/assignments', requireAdmin, (req, res) => {
  Assignment.getActive((err, assignments) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Errore server');
    }

    Vehicle.getAll((err, vehicles) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Errore server');
      }

      User.getByRole('rider', (err, riders) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Errore server');
        }

        // Conta manutenzioni pending
        getPendingMaintenanceCount((err, pendingMaintenanceCount) => {
          res.render('admin/assignments', {
            user: req.session,
            assignments,
            vehicles,
            riders,
            pendingMaintenanceCount: pendingMaintenanceCount || 0,
            success: req.flash('success'),
            error: req.flash('error')
          });
        });
      });
    });
  });
});

router.post('/assignments/create', requireAdmin, (req, res) => {
  const { rider_id, vehicle_id, data_assegnazione, note } = req.body;

  // Check conflicts
  Assignment.checkConflict(vehicle_id, data_assegnazione, (err, hasConflict) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore durante il controllo');
      return res.redirect('/admin/assignments');
    }

    if (hasConflict) {
      req.flash('error', 'Furgone già assegnato per questa data!');
      return res.redirect('/admin/assignments');
    }

    Assignment.create({ rider_id, vehicle_id, data_assegnazione, note }, (err) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore durante l\'assegnazione');
        return res.redirect('/admin/assignments');
      }

      // Update vehicle status
      Vehicle.updateStatus(vehicle_id, 'assegnato', (err) => {
        if (err) console.error('Error updating vehicle status:', err);
      });

      req.flash('success', 'Furgone assegnato con successo!');
      res.redirect('/admin/assignments');
    });
  });
});

// Termina singolo assegnamento
router.post('/assignments/end/:vehicleId', requireAdmin, (req, res) => {
  const vehicleId = req.params.vehicleId;
  
  Assignment.endActiveAssignments(vehicleId, (err) => {
    if (err) {
      console.error('Errore terminazione assegnamento:', err);
      req.flash('error', 'Errore durante la terminazione dell\'assegnamento');
      return res.redirect('/admin/assignments');
    }
    
    // Aggiorna status veicolo a disponibile
    Vehicle.updateStatus(vehicleId, 'disponibile', (err) => {
      if (err) {
        console.error('Errore update status:', err);
      }
      
      req.flash('success', 'Assegnamento terminato con successo! Furgone disponibile.');
      res.redirect('/admin/assignments');
    });
  });
});

// Termina TUTTI gli assegnamenti
router.post('/assignments/reset-all', requireAdmin, (req, res) => {
  // Prendi tutti gli assegnamenti attivi
  Assignment.getActive((err, assignments) => {
    if (err) {
      console.error('Errore recupero assegnamenti:', err);
      req.flash('error', 'Errore durante il recupero degli assegnamenti');
      return res.redirect('/admin/assignments');
    }

    if (!assignments || assignments.length === 0) {
      req.flash('error', 'Nessun assegnamento attivo da terminare');
      return res.redirect('/admin/assignments');
    }

    let completed = 0;
    let errors = 0;
    const totalAssignments = assignments.length;

    assignments.forEach(assignment => {
      Assignment.endActiveAssignments(assignment.vehicle_id, (err) => {
        completed++;
        
        if (err) {
          console.error(`Errore terminazione vehicle ${assignment.vehicle_id}:`, err);
          errors++;
        } else {
          // Aggiorna status veicolo a disponibile
          Vehicle.updateStatus(assignment.vehicle_id, 'disponibile', (err) => {
            if (err) console.error(`Errore update status vehicle ${assignment.vehicle_id}:`, err);
          });
        }

        // Quando tutti sono stati processati
        if (completed === totalAssignments) {
          const successCount = totalAssignments - errors;
          if (errors > 0) {
            req.flash('error', `${successCount}/${totalAssignments} assegnamenti terminati, ${errors} errori`);
          } else {
            req.flash('success', `✅ Tutti gli assegnamenti (${successCount}) sono stati terminati! Furgoni disponibili.`);
          }

// Assegnazione automatica furgoni (fissi + casuali)
router.post('/assignments/auto-assign', requireAdmin, (req, res) => {
  const dataAssegnazione = req.body.data_assegnazione || new Date().toISOString().split('T')[0];
  const db = require('../config/database');

  // 1. Ottieni tutti i rider attivi (senza assegnamenti attivi)
  db.all(`
    SELECT u.id, u.nome, u.cognome, u.fixed_vehicle_id
    FROM users u
    WHERE u.role = 'rider'
    AND u.id NOT IN (
      SELECT rider_id FROM vehicle_assignments WHERE status = 'attivo'
    )
    ORDER BY u.fixed_vehicle_id DESC, u.cognome, u.nome
  `, [], (err, riders) => {
    if (err) {
      console.error('Errore recupero rider:', err);
      req.flash('error', 'Errore durante il recupero dei rider');
      return res.redirect('/admin/assignments');
    }

    if (!riders || riders.length === 0) {
      req.flash('error', 'Nessun rider disponibile per l\'assegnazione');
      return res.redirect('/admin/assignments');
    }

    // 2. Ottieni tutti i veicoli disponibili (non assegnati, non in manutenzione)
    db.all(`
      SELECT v.id, v.targa, v.modello
      FROM vehicles v
      WHERE v.status = 'disponibile'
      AND (v.in_manutenzione = 0 OR v.in_manutenzione IS NULL)
      AND v.id NOT IN (
        SELECT vehicle_id FROM vehicle_assignments WHERE status = 'attivo'
      )
      ORDER BY v.targa
    `, [], (err, availableVehicles) => {
      if (err) {
        console.error('Errore recupero veicoli:', err);
        req.flash('error', 'Errore durante il recupero dei veicoli');
        return res.redirect('/admin/assignments');
      }

      if (!availableVehicles || availableVehicles.length === 0) {
        req.flash('error', 'Nessun veicolo disponibile per l\'assegnazione');
        return res.redirect('/admin/assignments');
      }

      // 3. Separa rider con e senza furgone fisso
      const ridersWithFixedVehicle = riders.filter(r => r.fixed_vehicle_id);
      const ridersWithoutFixedVehicle = riders.filter(r => !r.fixed_vehicle_id);

      let assigned = 0;
      let errors = [];
      const assignments = [];

      // 4. Assegna furgoni fissi
      ridersWithFixedVehicle.forEach(rider => {
        const vehicle = availableVehicles.find(v => v.id === rider.fixed_vehicle_id);
        if (vehicle) {
          assignments.push({
            rider_id: rider.id,
            vehicle_id: vehicle.id,
            rider_name: `${rider.nome} ${rider.cognome}`,
            vehicle_targa: vehicle.targa,
            type: 'fisso'
          });
          // Rimuovi il veicolo dalla lista disponibili
          const index = availableVehicles.indexOf(vehicle);
          if (index > -1) availableVehicles.splice(index, 1);
        } else {
          errors.push(`${rider.nome} ${rider.cognome}: furgone fisso ${rider.fixed_vehicle_id} non disponibile`);
        }
      });

      // 5. Assegna furgoni casuali ai rider senza fixed_vehicle
      ridersWithoutFixedVehicle.forEach(rider => {
        if (availableVehicles.length > 0) {
          // Prendi il primo veicolo disponibile (casuale)
          const vehicle = availableVehicles[0];
          assignments.push({
            rider_id: rider.id,
            vehicle_id: vehicle.id,
            rider_name: `${rider.nome} ${rider.cognome}`,
            vehicle_targa: vehicle.targa,
            type: 'casuale'
          });
          // Rimuovi dalla lista
          availableVehicles.shift();
        } else {
          errors.push(`${rider.nome} ${rider.cognome}: nessun furgone disponibile`);
        }
      });

      // 6. Crea gli assegnamenti nel database
      if (assignments.length === 0) {
        req.flash('error', 'Nessun assegnamento possibile. Errori: ' + errors.join(', '));
        return res.redirect('/admin/assignments');
      }

      let completed = 0;
      assignments.forEach(assignment => {
        Assignment.create({
          rider_id: assignment.rider_id,
          vehicle_id: assignment.vehicle_id,
          data_assegnazione: dataAssegnazione,
          note: `Assegnazione automatica (${assignment.type})`
        }, (err) => {
          if (err) {
            console.error('Errore creazione assegnamento:', err);
            errors.push(`${assignment.rider_name}: errore database`);
          } else {
            // Aggiorna status veicolo
            Vehicle.updateStatus(assignment.vehicle_id, 'assegnato', (err) => {
              if (err) console.error('Errore update status:', err);
            });
            assigned++;
          }

          completed++;

          // Quando tutti sono stati processati
          if (completed === assignments.length) {
            if (assigned > 0) {
              let message = `✅ ${assigned} furgoni assegnati automaticamente!`;
              if (errors.length > 0) {
                message += ` (${errors.length} errori: ${errors.join(', ')})`;
              }
              req.flash('success', message);
            } else {
              req.flash('error', 'Nessun assegnamento creato. Errori: ' + errors.join(', '));
            }
            res.redirect('/admin/assignments');
          }
        });
      });
    });
  });
});
          res.redirect('/admin/assignments');
        }
      });
    });
  });
});

// Reset assegnamenti multipli
router.post('/assignments/reset-multiple', requireAdmin, (req, res) => {
  const vehicleIds = req.body.vehicleIds || req.body['vehicleIds[]'] || [];
  
  console.log('Reset request:', req.body);
  console.log('Vehicle IDs:', vehicleIds);
  
  if (!vehicleIds || vehicleIds.length === 0) {
    req.flash('error', 'Nessun furgone selezionato');
    return res.redirect('/admin/dashboard');
  }

  const ids = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];
  console.log('IDs da resettare:', ids);
  
  let resetCount = 0;
  let errors = 0;
  let completed = 0;

  ids.forEach((vehicleId) => {
    // Termina assegnamenti attivi per questo veicolo
    Assignment.endActiveAssignments(vehicleId, (err) => {
      completed++;
      
      if (err) {
        console.error(`Errore reset vehicle ${vehicleId}:`, err);
        errors++;
      } else {
        // Aggiorna status veicolo a disponibile
        Vehicle.updateStatus(vehicleId, 'disponibile', (err) => {
          if (err) console.error(`Errore update status vehicle ${vehicleId}:`, err);
        });
        resetCount++;
      }

      // Quando abbiamo processato tutti
      if (completed === ids.length) {
        if (errors > 0) {
          req.flash('error', `${resetCount} furgoni resettati, ${errors} errori`);
        } else {
          req.flash('success', `${resetCount} assegnamento/i resettato/i con successo! Furgoni disponibili.`);
        }
        res.redirect('/admin/dashboard');
      }
    });
  });
});

// ===== MAINTENANCE SYSTEM =====
router.get('/maintenance', requireAdmin, (req, res) => {
  Maintenance.getAll((err, requests) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Errore server');
    }

    // Conta manutenzioni pending
    getPendingMaintenanceCount((err, pendingMaintenanceCount) => {
      res.render('admin/maintenance', {
        user: req.session,
        requests,
        pendingMaintenanceCount: pendingMaintenanceCount || 0,
        success: req.flash('success'),
        error: req.flash('error')
      });
    });
  });
});

router.post('/maintenance/resolve/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { resolution_notes } = req.body;

  // Prima ottieni i dettagli della manutenzione
  const db = require('../config/database');
  db.get('SELECT vehicle_id FROM maintenance_requests WHERE id = ?', [id], (err, request) => {
    if (err || !request) {
      console.error(err);
      req.flash('error', 'Errore nel recupero della richiesta');
      return res.redirect('/admin/maintenance');
    }

    Maintenance.updateStatus(id, 'resolved', req.session.userId, resolution_notes, (err) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore durante la risoluzione');
        return res.redirect('/admin/maintenance');
      }

      // Libera il veicolo dalla manutenzione
      db.run('UPDATE vehicles SET in_manutenzione = 0 WHERE id = ?', [request.vehicle_id], (err) => {
        if (err) console.error('Errore aggiornamento veicolo:', err);
      });

      req.flash('success', 'Richiesta manutenzione risolta!');
      res.redirect('/admin/maintenance');
    });
  });
});

// Cambia stato manutenzione (pending -> in_riparazione -> resolved)
router.post('/maintenance/change-status/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { new_status } = req.body;

  if (!['pending', 'in_riparazione', 'resolved'].includes(new_status)) {
    req.flash('error', 'Stato non valido');
    return res.redirect('/admin/maintenance');
  }

  // Prima ottieni i dettagli della manutenzione per prendere il vehicle_id
  const db = require('../config/database');
  db.get('SELECT vehicle_id FROM maintenance_requests WHERE id = ?', [id], (err, request) => {
    if (err || !request) {
      console.error(err);
      req.flash('error', 'Errore nel recupero della richiesta');
      return res.redirect('/admin/maintenance');
    }

    Maintenance.changeStatus(id, new_status, (err) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore durante il cambio stato');
        return res.redirect('/admin/maintenance');
      }

      // Se passo a in_riparazione, segno il veicolo come in manutenzione
      if (new_status === 'in_riparazione') {
        db.run('UPDATE vehicles SET in_manutenzione = 1 WHERE id = ?', [request.vehicle_id], (err) => {
          if (err) console.error('Errore aggiornamento veicolo:', err);
        });
      } 
      // Se risolvo, libero il veicolo
      else if (new_status === 'resolved') {
        db.run('UPDATE vehicles SET in_manutenzione = 0 WHERE id = ?', [request.vehicle_id], (err) => {
          if (err) console.error('Errore aggiornamento veicolo:', err);
        });
      }
      // Se torno a pending, libero il veicolo
      else if (new_status === 'pending') {
        db.run('UPDATE vehicles SET in_manutenzione = 0 WHERE id = ?', [request.vehicle_id], (err) => {
          if (err) console.error('Errore aggiornamento veicolo:', err);
        });
      }

      const statusMessages = {
        'pending': '⏳ Richiesta riportata in attesa',
        'in_riparazione': '🔧 Manutenzione presa in carico',
        'resolved': '✅ Manutenzione completata'
      };

      req.flash('success', statusMessages[new_status]);
      res.redirect('/admin/maintenance');
    });
  });
});

// ==================== ROSTER ====================

// Pagina roster
router.get('/roster', requireAdmin, (req, res) => {
  const db = require('../config/database');
  
  // Data di domani
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
  const tomorrowDisplay = tomorrow.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Ottieni tutti i driver attivi
  db.all(`
    SELECT u.*, v.targa as vehicle_targa 
    FROM users u
    LEFT JOIN vehicles v ON u.fixed_vehicle_id = v.id
    WHERE u.role = 'rider' AND u.is_active = 1
    ORDER BY u.cognome, u.nome
  `, [], (err, drivers) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Errore del server');
    }

    // Ottieni roster per domani
    db.all(`
      SELECT driver_id FROM roster_daily 
      WHERE roster_date = ?
    `, [tomorrowDateStr], (err, rosterEntries) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Errore del server');
      }

      const selectedDriverIds = rosterEntries.map(r => r.driver_id);
      const fixedVehicleCount = drivers.filter(d => selectedDriverIds.includes(d.id) && d.fixed_vehicle_id !== null).length;

      getPendingMaintenanceCount((err, pendingMaintenanceCount) => {
        res.render('admin/roster', {
          user: {
            nome: req.session.nome,
            cognome: req.session.cognome
          },
          activeDrivers: drivers || [],
          selectedDrivers: selectedDriverIds,
          fixedVehicleCount,
          tomorrowDate: tomorrowDisplay,
          pendingMaintenanceCount: pendingMaintenanceCount || 0,
          success: req.flash('success'),
          error: req.flash('error')
        });
      });
    });
  });
});

// Salva roster
router.post('/roster/save', requireAdmin, (req, res) => {
  const { driverIds } = req.body;
  const db = require('../config/database');

  if (!driverIds || driverIds.length === 0) {
    return res.json({ success: false, message: 'Nessun driver selezionato' });
  }

  // Data di domani
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  // Cancella roster esistente per domani
  db.run('DELETE FROM roster_daily WHERE roster_date = ?', [tomorrowDateStr], (err) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: 'Errore durante l\'eliminazione del roster precedente' });
    }

    // Inserisci nuovi driver
    const stmt = db.prepare('INSERT INTO roster_daily (driver_id, roster_date) VALUES (?, ?)');
    
    let completed = 0;
    driverIds.forEach(driverId => {
      stmt.run([driverId, tomorrowDateStr], (err) => {
        if (err) console.error('Errore inserimento driver:', err);
        completed++;
        
        if (completed === driverIds.length) {
          stmt.finalize();
          res.json({ success: true, message: 'Roster salvato con successo' });
        }
      });
    });
  });
});

// Reset roster (nuova giornata)
router.post('/roster/reset', requireAdmin, (req, res) => {
  const db = require('../config/database');
  
  // Data di domani
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  db.run('DELETE FROM roster_daily WHERE roster_date = ?', [tomorrowDateStr], (err) => {
    if (err) {
      console.error(err);
      req.flash('error', 'Errore durante il reset del roster');
    } else {
      req.flash('success', 'Roster resettato! Inizia una nuova giornata');
    }
    res.redirect('/admin/roster');
  });
});

module.exports = router;
