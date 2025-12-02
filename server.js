const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Session secret from environment or default
const SESSION_SECRET = process.env.SESSION_SECRET || 'gestionale-furgoni-secret-key-2025-change-in-production';

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 ore
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // HTTPS in production
  }
}));

app.use(flash());

// Middleware per rendere disponibili helper
app.use((req, res, next) => {
  // Helper per formattare date in formato italiano GG/MM/AAAA
  res.locals.formatDate = function(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Helper per convertire data italiana in formato SQL (YYYY-MM-DD)
  res.locals.toSqlDate = function(italianDate) {
    if (!italianDate) return '';
    const parts = italianDate.split('/');
    if (parts.length !== 3) return italianDate;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };
  
  next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/auth');
const riderRoutes = require('./routes/rider');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/rider', riderRoutes);
app.use('/admin', adminRoutes);

// Home page - redirect to login
app.get('/', (req, res) => {
  if (req.session.userId) {
    if (req.session.userRole === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/rider/dashboard');
    }
  }
  res.redirect('/auth/login');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { user: req.session.userId });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Errore del server');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
  console.log(`Usa CTRL+C per fermare il server`);
});
