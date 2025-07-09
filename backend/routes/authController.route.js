import { Router } from 'express';

import { login, getSession, logout } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/session', getSession);
router.post('/logout', logout);

// En tu archivo de rutas de auth

export default router;
