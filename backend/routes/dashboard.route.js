import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/dashboard', (req, res) => {
  // En este punto, authMiddleware ya confirmó sesión válida
  res.json({ message: 'Dashboard data', user: req.session.user });
});

export default router;
