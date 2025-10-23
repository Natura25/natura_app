import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar Supabase
const supabaseUrl = 'https://cakwobaaufisrjeplgxu.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNha3dvYmFhdWZpc3JqZXBsZ3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjQ0NDEsImV4cCI6MjA2NTcwMDQ0MX0.Lk31yef8t1dEq8G0M6HNmXG44-gSvTFSh1e3A5Ix6P4'; // Clave de servicio, no anon key

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function correctAuthIds() {
  try {
    console.log('🚀 Iniciando corrección de auth_ids...');

    // Obtener todos los usuarios de tu tabla
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('*');

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    console.log(`📊 Encontrados ${users.length} usuarios`);

    for (const user of users) {
      try {
        console.log(`🔍 Procesando usuario: ${user.email}`);

        // Verificar si el auth_id actual existe en auth.users
        if (user.auth_id) {
          const { data: authUser, error: authError } = await supabase
            .from('auth.users')
            .select('id')
            .eq('id', user.auth_id)
            .maybeSingle(); // Usar maybeSingle para evitar errores si no hay resultados

          if (authError) {
            console.error(`❌ Error verificando usuario en auth:`, authError);
            continue;
          }

          if (authUser) {
            console.log(`✅ auth_id ${user.auth_id} existe en auth.users`);
            continue; // El auth_id es válido, pasar al siguiente usuario
          } else {
            console.log(
              `❌ auth_id ${user.auth_id} NO existe en auth.users, necesitamos corregirlo`
            );
          }
        }

        // Buscar el usuario en auth.users por email
        const { data: authUsers, error: searchError } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', user.email)
          .limit(1);

        if (searchError) {
          console.error(`❌ Error buscando usuario por email:`, searchError);
          continue;
        }

        if (authUsers && authUsers.length > 0) {
          // Actualizar con el auth_id correcto
          const { error: updateError } = await supabase
            .from('usuarios')
            .update({ auth_id: authUsers[0].id })
            .eq('id', user.id);

          if (updateError) {
            console.error(`❌ Error actualizando auth_id:`, updateError);
          } else {
            console.log(
              `✅ Auth_id actualizado correctamente: ${authUsers[0].id}`
            );
          }
        } else {
          console.log(`⚠️ Usuario ${user.email} no encontrado en auth.users`);

          // Crear usuario en auth.users si no existe
          const { data: newUser, error: createError } =
            await supabase.auth.admin.createUser({
              email: user.email,
              password: 'TempPassword123!',
              email_confirm: true,
              user_metadata: {
                username: user.username,
              },
            });

          if (createError) {
            console.error(`❌ Error creando usuario:`, createError);
          } else {
            // Actualizar con el nuevo auth_id
            const { error: updateError } = await supabase
              .from('usuarios')
              .update({ auth_id: newUser.user.id })
              .eq('id', user.id);

            if (updateError) {
              console.error(`❌ Error actualizando auth_id:`, updateError);
            } else {
              console.log(
                `✅ Usuario creado y auth_id actualizado: ${newUser.user.id}`
              );
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error procesando usuario ${user.email}:`, error);
      }
    }

    console.log('🎉 Proceso de corrección completado');
  } catch (error) {
    console.error('❌ Error en corrección:', error);
  }
}

// Ejecutar la corrección
correctAuthIds();
