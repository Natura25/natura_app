// utils/createUser.js (archivo temporal para insertar usuario)
import bcrypt from 'bcrypt';
import { createUser } from '../models/userModel.js';

const run = async () => {
  const username = 'Jose';
  const password = '01020102'; // contraseña original
  const cedula = '123123123';
  const rol = 'admin';

  const hash = await bcrypt.hash(password, 10);
  const userId = await createUser(username, hash, cedula, rol);
  console.log('Usuario creado con ID:', userId);
};

run();
