// Middleware per verificare che l'utente sia admin
const adminOnly = (req, res, next) => {
  // Verifica che l'utente sia autenticato (dovrebbe essere già verificato dal middleware auth)
  if (!req.user) {
    return res.status(401).json({ message: 'Accesso negato. Token non valido.' });
  }

  // Verifica che l'utente sia admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Accesso negato. Privilegi di amministratore richiesti.' 
    });
  }

  next();
};

module.exports = adminOnly;
