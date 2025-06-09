export function authMiddleware(req, res, next) {
  if (req.session && req.session.user) {
    next(); // Usuario autenticado, continúa con la ruta
  } else {
    res.status(401).json({ error: 'No autorizado. Inicia sesión primero.' });
  }
}
