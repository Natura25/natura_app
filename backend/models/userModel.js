import db from '../schemas/db.js'; // tu pool de pg

// Buscar usuario por username
export async function findUserByUsername(username) {
  const { rows } = await db.query(
    `
    SELECT u.id, u.username, u.password, u.cedula, u.email, u.telefono, r.nombre as rol, u.activo
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.username = $1
  `,
    [username]
  );

  return rows[0];
}

// Crear usuario
export async function createUser(
  username,
  passwordHash,
  cedula,
  email,
  telefono,
  rolNombre = 'vendedor'
) {
  const { rows } = await db.query(
    `
    INSERT INTO usuarios (username, password, cedula, email, telefono, rol_id)
    VALUES ($1, $2, $3, $4, $5,
      (SELECT id FROM roles WHERE nombre = $6)
    ) RETURNING id
  `,
    [username, passwordHash, cedula, email, telefono, rolNombre]
  );

  return rows[0].id;
}
