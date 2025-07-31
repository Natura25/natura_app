import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByUsername, findUserById } from '../models/userModel.js';

// Secret para JWT (usa variable de entorno en producción)
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-jwt-super-secreto';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

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

    // Crear payload para el JWT
    const payload = {
      id: user.id,
      username: user.username,
      rol: user.rol,
      email: user.email,
    };

    // Generar JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log('✅ Login exitoso - JWT generado para:', user.username);

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        rol: user.rol,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSession(req, res) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      return res
        .status(401)
        .json({ authenticated: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);

    console.log('✅ Token válido para usuario:', decoded.username);

    // Opcional: Verificar si el usuario aún existe y está activo
    const user = await findUserById(decoded.id);
    if (!user || !user.activo) {
      console.log('❌ Usuario no encontrado o inactivo');
      return res
        .status(401)
        .json({ authenticated: false, error: 'User not found or inactive' });
    }

    res.json({
      authenticated: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        rol: decoded.rol,
        email: decoded.email,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ Token inválido:', error.message);
      return res
        .status(401)
        .json({ authenticated: false, error: 'Invalid token' });
    }

    if (error.name === 'TokenExpiredError') {
      console.log('❌ Token expirado');
      return res
        .status(401)
        .json({ authenticated: false, error: 'Token expired' });
    }

    console.error('❌ Error verificando token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function logout(req, res) {
  // Con JWT no necesitas hacer nada en el servidor
  // El cliente simplemente elimina el token
  console.log('🚪 Logout called - client should remove token');

  res.json({
    message: 'Logout successful',
    instruction: 'Remove token from client storage',
  });
}

// Middleware para proteger rutas (opcional, para usar en otras rutas)
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
}
