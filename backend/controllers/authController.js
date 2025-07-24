import bcrypt from 'bcrypt';
import { findUserByUsername } from '../models/userModel.js';

export async function login(req, res) {
  const { username, password } = req.body;

  const user = await findUserByUsername(username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  req.session.user = user.id;
  req.session.rol = user.rol;

  res.json({
    message: 'Login successful',
    id: user.id,
    username: user.username,
    rol: user.rol,
  });
}

export function getSession(req, res) {
  console.log('🔍 getSession called:', {
    sessionID: req.sessionID,
    hasUser: !!req.session?.user,
    userId: req.session?.user,
    rol: req.session?.rol,
  });

  if (!req.session.user) {
    console.log('❌ No session found');
    return res.status(401).json({ authenticated: false });
  }

  console.log('✅ Session found');
  res.json({
    authenticated: true,
    id: req.session.user,
    rol: req.session.rol,
  });
}

export function logout(req, res) {
  req.session.destroy(() => {
    res.json({ message: 'Logout successful' });
  });
}
