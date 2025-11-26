// utils/confirmUser.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual del módulo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv para que busque el .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('📁 Ruta del .env:', path.resolve(__dirname, '../.env'));
console.log('🔍 Variables cargadas:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log(
  'SUPABASE_SERVICE_KEY:',
  process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌'
);

// Resto del código igual...
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function confirmUser() {
  try {
    console.log('🔄 Confirmando usuario...');

    const { data: updatedUser, error: updateError } =
      await supabase.auth.admin.updateUserById(
        'a3fb4d9c-c064-42f5-b271-9ae88cdee0c6',
        { email_confirm: true }
      );

    if (updateError) {
      console.error('❌ Error:', updateError.message);
    } else {
      console.log('🎉 ¡Usuario confirmado!');
      console.log('📧', updatedUser.user.email);
      console.log('✅ Confirmado:', updatedUser.user.email_confirmed_at);
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

confirmUser();
