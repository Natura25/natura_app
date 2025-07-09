import { Router } from 'express';

import { login, getSession, logout } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/session', getSession);
router.post('/logout', logout);

// En tu archivo de rutas de auth
app.get('/api/auth/check-session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user,
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
