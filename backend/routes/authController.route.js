import { Router } from 'express';

import { login, getSession, logout } from '../controllers/authController.js';

const router = Router();

router.use((req, res, next) => {
  console.log('🌍 Request Info:', {
    method: req.method,
    path: req.path,
    origin: req.get('Origin'),
    sessionID: req.sessionID,
    hasSession: !!req.session?.user,
    cookies: req.headers.cookie ? 'Cookies present' : 'No cookies',
    userAgent: req.get('User-Agent')?.substring(0, 50),
  });
  next();
});

router.post('/login', login);
router.get('/session', getSession);
router.get('/check-session', getSession);
router.post('/logout', logout);

export default router;
