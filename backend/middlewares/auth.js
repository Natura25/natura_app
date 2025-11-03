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

    // Verificar token con Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('❌ Token inválido o expirado:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // ⚠️ IMPORTANTE: Obtener datos adicionales del usuario desde la tabla usuarios
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select(
        `
        *,
        rol:roles(id, nombre)
      `
      )
      .eq('auth_id', user.id)
      .single();

    if (usuarioError) {
      console.error(
        '⚠️ Usuario no encontrado en tabla usuarios:',
        usuarioError
      );
      // Continuar con datos básicos si el usuario no está en la tabla
    }

    // Agregar usuario al request con la estructura correcta
    req.user = {
      id: user.id, // ✅ Este es el auth_id (UUID) que necesitas para las ventas
      email: user.email,
      email_confirmed: user.email_confirmed_at !== null,
      phone: user.phone,
      created_at: user.created_at,
      // Datos adicionales si existen en la tabla usuarios
      ...(usuarioData && {
        usuario_id: usuarioData.id, // ID integer de la tabla usuarios
        username: usuarioData.username,
        cedula: usuarioData.cedula,
        telefono: usuarioData.telefono,
        rol_id: usuarioData.rol_id,
        rol_nombre: usuarioData.rol?.nombre,
        activo: usuarioData.activo,
      }),
      // Permisos (puedes expandir esto según tu lógica de permisos)
      permisos:
        usuarioData?.rol?.nombre === 'admin'
          ? ['*'] // Admin tiene todos los permisos
          : ['costos:leer', 'ventas:leer', 'ventas:crear'], // Permisos básicos
    };

    console.log(
      `✅ Usuario autenticado: ${req.user.email} (auth_id: ${req.user.id})`
    );

    next();
  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
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

    // Si el usuario tiene permiso '*' (admin), permitir todo
    if (userPermisos.includes('*')) {
      return next();
    }

    // Verificar si tiene alguno de los permisos requeridos
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

// =============================================
// MIDDLEWARE DE ROLES
// =============================================

export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!req.user.rol_nombre) {
      return res.status(403).json({
        error: 'Usuario sin rol asignado',
      });
    }

    if (!rolesPermitidos.includes(req.user.rol_nombre)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        mensaje: 'No tienes permisos para realizar esta acción',
        rol_requerido: rolesPermitidos,
        tu_rol: req.user.rol_nombre,
      });
    }

    next();
  };
};

// =============================================
// MIDDLEWARE DE AUTENTICACIÓN OPCIONAL
// =============================================

export async function autenticacionOpcional(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('*, rol:roles(id, nombre)')
          .eq('auth_id', user.id)
          .single();

        req.user = {
          id: user.id,
          email: user.email,
          ...(usuarioData && {
            username: usuarioData.username,
            rol_id: usuarioData.rol_id,
            rol_nombre: usuarioData.rol?.nombre,
          }),
        };
      }
    }

    // Continuar incluso sin autenticación
    next();
  } catch (error) {
    // En autenticación opcional, ignoramos errores
    next();
  }
}
