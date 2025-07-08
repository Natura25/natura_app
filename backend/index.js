import express from 'express';
import db from './schemas/db.js';
import session from 'express-session';
import authRoutes from './routes/authController.route.js';
import ventasRoutes from './routes/ventasController.route.js';
import cuentasRoutes from './routes/cuentasPorCobrar.route.js';
import cors from 'cors';
import cuentasContablesRoutes from './routes/cuentasContables.route.js';

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173', // Puerto de Vite
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secreto123',
    resave: false,
    saveUninitialized: false,
  })
);
import cuentasPorPagarRoutes from './routes/cuentasPorPagar.route.js';

app.use('/api/cuentas-pagar', cuentasPorPagarRoutes); // Rutas de cuentas por pagar
app.use('/api/cuentas', cuentasRoutes); // Rutas de cuentas por cobrar
app.use('/api/auth', authRoutes); // Rutas de autenticación
app.use('/api/ventas', ventasRoutes); // Rutas de ventas
app.use('/api/cuentas-contables', cuentasContablesRoutes);

//! Revisa si la base de datos está conectada (MYSQL)

// try {
//   const connection = await db.getConnection();
//   console.log('connected to the database');
//   connection.release(); // Libera la conexion una vez que se ha utilizado
// } catch (error) {
//   console.error('Error connecting to the database:', error);
//   process.exit(1); // sale del proceso si no se puede conectar a la base de datos
// }

//! Puerto del servidor

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, username, cedula, email, telefono, rol_id, activo, creado_en, actualizado_en 
      FROM usuarios
    `);
    res.json(result.rows);
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

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
