// middlewares/authMiddleware.js
import { supabase } from '../config/supabase.js';
import { validationResult } from 'express-validator';

// 👈 Cambia el nombre para que coincida con las rutas
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

    // 👈 Agregar permisos simulados para pruebas
    req.user = {
      ...user,
      permisos: ['costos:admin', 'costos:escribir', 'costos:leer'], // Temporalmente para pruebas
    };

    next();
  } catch (error) {
    console.error('❌ Error en middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const verificarPermisos = (permisosRequeridos) => {
  return (req, res, next) => {
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

export const validarCampos = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: errors.array().map((err) => ({
        campo: err.path,
        valor: err.value,
        mensaje: err.msg,
      })),
    });
  }

  next();
};

// 👈 Mantén esta como alias si la usas en otros lados
export { verificarToken as authMiddleware };
