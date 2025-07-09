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
import dashboardRoutes from './routes/dashboard.route.js';

const app = express();
const PgSession = pgSession(session);

app.use(express.json());

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://localhost:5173'],
    credentials: true,
  })
);

// ✅ Usar PostgreSQL como store para sesiones (esto elimina el warning)
app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: 'user_sessions', // nombre de tabla (opcional)
    }),
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // debe ser true solo en producción con HTTPS
      sameSite: 'Lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
  })
);

// Rutas
app.use('/api', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/cuentas-contables', cuentasContablesRoutes);
app.use('/api/cuentas-pagar', cuentasPorPagarRoutes);

// Endpoint básico
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Puerto
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server is running on port ${PORT}`);
});
