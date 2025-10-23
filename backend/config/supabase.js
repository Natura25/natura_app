// config/supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Verificando variables en supabase.js:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log(
  'SUPABASE_SERVICE_KEY:',
  process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌'
);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables faltantes:');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY);
  throw new Error('Faltan variables de configuración de Supabase');
}

console.log('✅ Supabase configurado correctamente');
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
