import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cors from 'cors';
import db from './schemas/db.js';
import authRoutes from './routes/authController.route.js';
import ventasRoutes from './routes/ventasController.route.js';
import cuentasRoutes from './routes/cuentasPorCobrar.route.js';
import cuentasContablesRoutes from './routes/cuentasContables.route.js';
import cuentasPorPagarRoutes from './routes/cuentasPorPagar.route.js';

const app = express();
const PgSession = pgSession(session);

app.use(express.json());

// ✅ CORS SÚPER PERMISIVO PARA TESTING
console.log('🔧 Setting up CORS...');
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://localhost:5173', // por si usas HTTPS local
    ],
    credentials: true, // ← CRÍTICO
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// ✅ Headers manuales adicionales (por si acaso)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Origin, X-Requested-With, Accept'
  );

  console.log('📥 Request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
  });

  // Responder inmediatamente a OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ✅ Configuración de sesión
app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'secreto123',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Nombre explícito
    cookie: {
      secure: true, // ← true porque Render usa HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'none', // ← CRÍTICO para cross-origin
      domain: undefined, // ← No especificar domain para cross-origin
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
  console.log('🏠 Home route hit');
  res.json({ message: 'Hello World! CORS should work now' });
});

// Puerto
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server is running on port ${PORT}`);
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
});
