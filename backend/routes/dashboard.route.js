import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({
    message: 'Bienvenido al dashboard experimental',
    user: req.session.user, // info del usuario si quieres
  });
});

export default router;
