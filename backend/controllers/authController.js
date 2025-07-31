import bcrypt from 'bcrypt';
import { findUserByUsername, findUserById } from '../models/userModel.js';

export async function login(req, res) {
  const { username, password } = req.body;

  try {
    const user = await findUserByUsername(username);

    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Guardar información completa en la sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      rol: user.rol,
      email: user.email,
    };

    // Log para debugging
    console.log('✅ Login exitoso - Sesión guardada:', {
      sessionID: req.sessionID,
      user: req.session.user,
    });

    // Forzar que la sesión se guarde antes de responder
    req.session.save((err) => {
      if (err) {
        console.error('❌ Error guardando sesión:', err);
        return res.status(500).json({ error: 'Error saving session' });
      }

      res.json({
        message: 'Login successful',
        id: user.id,
        username: user.username,
        rol: user.rol,
      });
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSession(req, res) {
  console.log('🔍 getSession called:', {
    sessionID: req.sessionID,
    hasUser: !!req.session?.user,
    userSession: req.session?.user,
  });

  if (!req.session?.user) {
    console.log('❌ No session found');
    return res.status(401).json({ authenticated: false });
  }

  try {
    // Si solo guardaste el ID, busca los datos completos
    let userData = req.session.user;

    if (typeof userData === 'number') {
      // Si solo guardaste el ID, busca el usuario completo
      const user = await findUserById(userData);
      if (!user) {
        console.log('❌ User not found in database');
        return res.status(401).json({ authenticated: false });
      }
      userData = {
        id: user.id,
        username: user.username,
        rol: user.rol,
      };
    }

    console.log('✅ Session found:', userData);
    res.json({
      authenticated: true,
      user: userData, // Envía el objeto user completo
      ...userData, // También incluye los campos directamente
    });
  } catch (error) {
    console.error('❌ Error en getSession:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function logout(req, res) {
  console.log('🚪 Logout called for session:', req.sessionID);

  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Error destroying session:', err);
      return res.status(500).json({ error: 'Error logging out' });
    }

    res.clearCookie('connect.sid'); // Limpia la cookie de sesión
    res.json({ message: 'Logout successful' });
  });
}
