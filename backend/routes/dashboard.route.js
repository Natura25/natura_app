import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/api/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  // Aquí tu lógica para dashboard si está autorizado
  res.json({ message: 'Dashboard data', user: req.session.user });
});

export default router;
