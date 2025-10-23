// utils/createUser.js
import bcrypt from 'bcrypt';
import { createUser } from '../models/userModel.js';

// ← FORZAR CONEXIÓN A SUPABASE
process.env.NODE_ENV = 'production';

const run = async () => {
  try {
    const username = 'Jose';
    const password = '1234'; // contraseña original
    const cedula = '123123123';
    const email = 'AlanBritto@example.com';
    const telefono = '80912345555';
    const rol = 'admin';

    console.log('🔨 Hasheando contraseña...');
    const hash = await bcrypt.hash(password, 10);

    console.log('👤 Creando usuario en Supabase...');
    const userId = await createUser(
      username,
      hash,
      cedula,
      email,
      telefono,
      rol
    );

    console.log('✅ Usuario creado exitosamente con ID:', userId);
    console.log('📋 Datos del usuario:');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Rol: ${rol}`);
    console.log(`   Cédula: ${cedula}`);

    process.exit(0); // Salir exitosamente
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    process.exit(1); // Salir con error
  }
};

run();
