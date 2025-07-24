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
    origin: true, // ← Permite CUALQUIER origen (solo para testing)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Origin',
      'X-Requested-With',
      'Accept',
    ],
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
    }),
    secret: process.env.SESSION_SECRET || 'secreto123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

app.get('/api/auth/check-session', (req, res) => {
  console.log('🔍 Checking session');
  if (req.session && req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user,
    });
  } else {
    res.status(401).json({
      authenticated: false,
      message: 'No valid session found',
    });
  }
});

// Puerto
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server is running on port ${PORT}`);
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
});
