import db from '../schemas/db.js';

export async function findUserByUsername(username) {
  const [user] = await db.query('SELECT * FROM usuarios WHERE username = ?', [
    username,
  ]);
  return user[0];
}

export async function createUser(
  username,
  passwordHash,
  cedula,
  rol = 'admin'
) {
  const [result] = await db.execute(
    'INSERT INTO usuarios (username, password, cedula, rol) VALUES (?, ?, ?, ?)',
    [username, passwordHash, cedula, rol]
  );
  return result.insertId;
}
