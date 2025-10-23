import { supabase } from '../config/supabase.js';

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Login directo con email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('❌ Error en login Supabase:', error.message);
      return res.status(401).json({ error: error.message });
    }

    // Obtenemos los datos del usuario de la tabla usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, username, auth_id, email, cedula, telefono, rol_id, activo')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('❌ Error obteniendo datos de usuario:', userError);
      return res.status(500).json({ error: 'Error retrieving user data' });
    }

    console.log('✅ Login exitoso con Supabase para:', email);

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: userData.id,
        auth_id: data.user.id,
        username: userData.username,
        email: data.user.email,
        cedula: userData.cedula,
        telefono: userData.telefono,
        rol_id: userData.rol_id,
        activo: userData.activo,
      },
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function signup(req, res) {
  const { username, password, email, cedula, telefono } = req.body;

  try {
    // 1. Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (error) {
      console.error('❌ Error en registro:', error.message);
      return res.status(400).json({ error: error.message });
    }

    // 2. Crear registro en nuestra tabla de usuarios usando el UUID de Supabase
    const { error: dbError } = await supabase.from('usuarios').insert([
      {
        auth_id: data.user.id, // Este es el UUID de Supabase Auth
        username: username,
        email: email,
        cedula: cedula || null,
        telefono: telefono || null,
        rol_id: 2, // Valor por defecto
        activo: true,
        creado_en: new Date(),
      },
    ]);

    if (dbError) {
      console.error('❌ Error creando registro de usuario:', dbError);
      // Opcional: revertir la creación en Auth si falla
      return res.status(400).json({ error: 'Error creating user profile' });
    }

    res.json({
      message: 'User registered successfully',
      user: {
        id: data.user.id, // UUID de Supabase
        username: username,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSession(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ authenticated: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      return res
        .status(401)
        .json({ authenticated: false, error: error.message });
    }

    if (!user) {
      return res
        .status(401)
        .json({ authenticated: false, error: 'User not found' });
    }

    // Obtenemos los datos del usuario usando el UUID de Supabase
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('username, email, cedula, telefono, rol_id, activo')
      .eq('auth_id', user.id) // Buscamos por el UUID de Supabase
      .single();

    if (userError) {
      console.error('❌ Error obteniendo datos de usuario:', userError);
      return res.status(404).json({
        authenticated: false,
        error: 'User profile not found',
      });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id, // UUID de Supabase
        username: userData.username,
        email: user.email,
        cedula: userData.cedula,
        telefono: userData.telefono,
        rol_id: userData.rol_id,
        activo: userData.activo,
      },
    });
  } catch (error) {
    console.error('❌ Error en getSession:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await supabase.auth.signOut(token);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function authenticateToken(req, res, next) {
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

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Error en middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function refreshToken(req, res) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh_token,
    });

    if (error) {
      console.error('❌ Error refrescando token:', error.message);
      return res.status(401).json({ error: error.message });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    console.error('❌ Error refrescando token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function migrateUsers(req, res) {
  try {
    // Verificar que sea una solicitud autorizada (protege este endpoint)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Obtener todos los usuarios de tu tabla
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('*');

    if (usersError) throw usersError;

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Si ya tiene auth_id, saltar
        if (user.auth_id) {
          console.log(
            `✅ Usuario ${user.email} ya tiene auth_id: ${user.auth_id}`
          );
          continue;
        }

        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: user.email,
            password: 'TempPassword123!', // Password temporal
            options: {
              data: {
                username: user.username,
              },
            },
          }
        );

        if (authError) {
          console.error(`❌ Error creando usuario ${user.email}:`, authError);
          errorCount++;
          continue;
        }

        // Actualizar la tabla con el auth_id
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ auth_id: authData.user.id })
          .eq('id', user.id);

        if (updateError) {
          console.error(
            `❌ Error actualizando usuario ${user.email}:`,
            updateError
          );
          errorCount++;
        } else {
          console.log(
            `✅ Usuario ${user.email} migrado con auth_id: ${authData.user.id}`
          );
          migratedCount++;
        }
      } catch (error) {
        console.error(`❌ Error procesando usuario ${user.email}:`, error);
        errorCount++;
      }
    }

    res.json({
      message: 'Migración completada',
      summary: {
        total: users.length,
        migrated: migratedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('❌ Error en migración:', error);
    res.status(500).json({ error: 'Error en migración' });
  }
}
