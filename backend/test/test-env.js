import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la carpeta padre (backend/)
const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error cargando .env:', result.error);
  console.log('📁 Buscando en:', envPath);
  process.exit(1);
}

console.log('✅ .env cargado desde:', envPath);
console.log('🔍 Verificando variables de entorno:\n');

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'JWT_SECRET',
  'FRONTEND_URL',
  'PORT',
];

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(
      `✅ ${varName}: ${
        varName.includes('KEY') || varName.includes('SECRET')
          ? value.substring(0, 20) + '...'
          : value
      }`
    );
  } else {
    console.log(`❌ ${varName}: NO DEFINIDA`);
  }
});

console.log('\n🔗 Intentando conectar a Supabase...');

import { createClient } from '@supabase/supabase-js';

try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const { data, error } = await supabase.from('usuarios').select('count');

  if (error) {
    console.log('⚠️ Error al consultar:', error.message);
  } else {
    console.log('✅ Conexión exitosa a Supabase');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
