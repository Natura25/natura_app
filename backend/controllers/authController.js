import bcrypt from 'bcrypt';
import { findUserByUsername } from '../models/userModel.js';

export async function login(req, res) {
  // Sacamos el username y password del body y lo guardamos en variables
  const { username, password } = req.body;

  const user = await findUserByUsername(username);

  // Si no existe el usuario, devolvemos un error 401
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  // Comparamos la contraseña que nos llega con la que tenemos en la base de datos
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
    cedula: user.cedula,
    rol: user.rol,
  });
}

export function getSession(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ authenthicated: false });
  }

  res.json({
    authenthicated: true,
    id: req.session.user,
    rol: req.session.rol,
  });
}

export function logout(req, res) {
  req.session.destroy(() => {
    res.json({ message: 'Logout successful' });
  });
}
