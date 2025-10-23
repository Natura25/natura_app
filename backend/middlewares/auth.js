// middleware/auth.js
import { supabase } from '../config/supabase.js';

// =============================================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================================

export async function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Agregar permisos simulados para pruebas
    // TODO: En producción, obtener permisos reales de la base de datos
    req.user = {
      ...user,
      permisos: ['costos:admin', 'costos:escribir', 'costos:leer'], // Temporalmente para pruebas
    };

    next();
  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// =============================================
// MIDDLEWARE DE AUTORIZACIÓN
// =============================================

export const verificarPermisos = (permisosRequeridos) => {
  return (req, res, next) => {
    // Verificar que el usuario existe (debería haber pasado por verificarToken)
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const userPermisos = req.user?.permisos || [];

    const tienePermiso = permisosRequeridos.some((permiso) =>
      userPermisos.includes(permiso)
    );

    if (!tienePermiso) {
      return res.status(403).json({
        error: 'Sin permisos suficientes',
        permisos_requeridos: permisosRequeridos,
        permisos_usuario: userPermisos,
      });
    }

    next();
  };
};
