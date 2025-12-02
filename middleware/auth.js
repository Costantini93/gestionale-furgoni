// Middleware per proteggere le route che richiedono autenticazione
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
}

// Middleware per verificare che l'utente sia un rider
function requireRider(req, res, next) {
  if (!req.session.userId || req.session.userRole !== 'rider') {
    return res.redirect('/auth/login');
  }
  next();
}

// Middleware per verificare che l'utente sia admin
function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.redirect('/auth/login');
  }
  next();
}

module.exports = {
  requireAuth,
  requireRider,
  requireAdmin
};
