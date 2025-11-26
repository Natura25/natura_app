// middlewares/verificarAdmin.js
import db from '../schemas/db.js';
/**
 * Middleware para verificar si el usuario tiene rol de administrador.
 * Asume que el ID del usuario autenticado está en req.session.usuario.id.
 * Si el usuario no está autenticado o no es admin, devuelve un error 401 o 403.
 */
export async function verificarAdminMiddleware(req, res, next) {
  try {
    const usuarioId = req.session.usuario?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const result = await db.query(
      `SELECT r.nombre FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [usuarioId]
    );

    const rol = result.rows[0]?.nombre;
    if (rol !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Acceso denegado: se requiere rol admin' });
    }

    next();
  } catch (error) {
    console.error('Error en verificarAdminMiddleware:', error);
    res.status(500).json({ error: 'Error en la verificación de rol' });
  }
}
