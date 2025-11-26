import express from 'express';
import {
  login,
  signup,
  getSession,
  logout,
  authenticateToken,
  refreshToken,
  migrateUsers,
} from '../controllers/authController.js';

const router = express.Router();

// Rutas públicas
router.post('/login', login);
router.post('/signup', signup);
router.post('/refresh', refreshToken);

// Rutas que requieren autenticación
router.get('/session', getSession);
router.post('/logout', logout);

// Ruta protegida de ejemplo
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'Perfil protegido',
    user: req.user,
  });
});

router.post('/migrate-users', migrateUsers);

export default router;
