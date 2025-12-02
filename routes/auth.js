const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

// Pagina di login
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  const errorMessages = req.flash('error');
  const successMessages = req.flash('success');
  console.log('Error messages:', errorMessages);
  console.log('Success messages:', successMessages);
  res.render('login', { 
    error: errorMessages,
    success: successMessages
  });
});

// Gestione login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', { 
      error: ['Inserisci username e password'],
      success: []
    });
  }

  User.findByUsername(username, async (err, user) => {
    if (err) {
      console.error(err);
      return res.render('login', { 
        error: ['Errore del server'],
        success: []
      });
    }

    if (!user) {
      return res.render('login', { 
        error: ['Username o password non corretti'],
        success: []
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render('login', { 
        error: ['Username o password non corretti'],
        success: []
      });
    }

    // Login effettuato
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;
    req.session.nome = user.nome;
    req.session.cognome = user.cognome;

    // Se è il primo login, redirect a cambio password
    if (user.first_login === 1) {
      return res.redirect('/auth/change-password');
    }

    // Redirect in base al ruolo
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/rider/dashboard');
    }
  });
});

// Pagina cambio password (primo accesso)
router.get('/change-password', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  res.render('change-password', { 
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// Gestione cambio password
router.post('/change-password', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }

  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    req.flash('error', 'Compila tutti i campi');
    return res.redirect('/auth/change-password');
  }

  if (newPassword.length < 6) {
    req.flash('error', 'La password deve essere di almeno 6 caratteri');
    return res.redirect('/auth/change-password');
  }

  if (newPassword !== confirmPassword) {
    req.flash('error', 'Le password non corrispondono');
    return res.redirect('/auth/change-password');
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    User.updatePassword(req.session.userId, hashedPassword, (err) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Errore durante il cambio password');
        return res.redirect('/auth/change-password');
      }

      req.flash('success', 'Password cambiata con successo!');
      
      // Redirect in base al ruolo
      if (req.session.userRole === 'admin') {
        res.redirect('/admin/dashboard');
      } else {
        res.redirect('/rider/dashboard');
      }
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Errore durante il cambio password');
    res.redirect('/auth/change-password');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
