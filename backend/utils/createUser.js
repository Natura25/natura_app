// utils/createUser.js
import bcrypt from 'bcrypt';
import { createUser } from '../models/userModel.js';

const run = async () => {
  const username = 'Ayrton Corniel';
  const password = 'Tornado'; // contraseña original
  const cedula = '123123123';
  const email = 'ACorniel@example.com'; // agrega email
  const telefono = '8091234567'; // agrega teléfono
  const rol = 'admin';

  const hash = await bcrypt.hash(password, 10);
  const userId = await createUser(username, hash, cedula, email, telefono, rol);
  console.log('Usuario creado con ID:', userId);
};

run();
// Ejecuta la función para crear el usuario
