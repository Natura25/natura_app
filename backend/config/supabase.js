// backend/config/supabase.js
import dotenv from 'dotenv';
dotenv.config(); // Carga el .env automáticamente desde backend/

import { createClient } from '@supabase/supabase-js';

console.log('Verificando variables en supabase.js:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Cargada' : 'Faltante');
console.log(
  'SUPABASE_SERVICE_KEY:',
  process.env.SUPABASE_SERVICE_KEY ? 'Cargada' : 'Faltante'
);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Variables faltantes:');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY);
  throw new Error('Faltan variables de configuración de Supabase');
}

console.log('Supabase configurado correctamente');
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
