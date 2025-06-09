import express from 'express';
import db from './schemas/db.js';
import session from 'express-session';
import authRoutes from './routes/authController.route.js';
import ventasRoutes from './routes/ventasController.route.js';

const app = express();

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secreto123',
    resave: false,
    saveUninitialized: false,
  })
);

app.use('/api/auth', authRoutes); // Rutas de autenticación
app.use('/api/ventas', ventasRoutes); // Rutas de ventas

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT id, username, cedula, rol FROM usuarios WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]); // Solo enviamos un objeto, no un array de 1 elemento
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//! Revisa si la base de datos está conectada

try {
  const connection = await db.getConnection();
  console.log('connected to the database');
  connection.release(); // Libera la conexion una vez que se ha utilizado
} catch (error) {
  console.error('Error connecting to the database:', error);
  process.exit(1); // sale del proceso si no se puede conectar a la base de datos
}

//! Puerto del servidor

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
