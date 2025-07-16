import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cors from 'cors';
import db from './schemas/db.js'; // tu pool de PostgreSQL
import authRoutes from './routes/authController.route.js';
import ventasRoutes from './routes/ventasController.route.js';
import cuentasRoutes from './routes/cuentasPorCobrar.route.js';
import cuentasContablesRoutes from './routes/cuentasContables.route.js';
import cuentasPorPagarRoutes from './routes/cuentasPorPagar.route.js';

const app = express();
const PgSession = pgSession(session);

app.use(express.json());

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://localhost:5173'],
    credentials: true,
  })
);

// ✅ Usar PostgreSQL como store para sesiones
app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: 'user_sessions', // opcional: nombre de tabla
    }),
    secret: process.env.SESSION_SECRET || 'secreto123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // pon true si usas HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
  })
);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/cuentas-contables', cuentasContablesRoutes);
app.use('/api/cuentas-pagar', cuentasPorPagarRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/auth/check-session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user,
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// app.get('/api/usuarios', async (req, res) => {
//   try {
//     const result = await db.query(`
//       SELECT id, username, cedula, email, telefono, rol_id, activo, creado_en, actualizado_en
//       FROM usuarios
//     `);
//     res.json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.get('/api/usuarios/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await db.query(
//       'SELECT id, username, cedula, rol FROM usuarios WHERE id = $1',
//       [id]
//     );
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('❌ Error:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// Puerto
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server is running on port ${PORT}`);
});
