import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT), // mejor asegurar que sea número
  ssl: { rejectUnauthorized: false }, // importante para Supabase
});

async function testConnection() {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('🟢 Conectado a la base de datos:', result.rows[0].now);
  } catch (error) {
    console.error('🔴 Error al conectar a la base de datos', error);
    process.exit(1); // Sale del proceso si no se puede conectar a la base de datos
  }
}

testConnection();

export default db;
