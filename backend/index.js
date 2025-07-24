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

// Detectar entorno
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(express.json());

// ✅ CORS configurado para desarrollo y producción
app.use(
  cors({
    origin: isDevelopment
      ? [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://127.0.0.1:5173',
          'https://localhost:5173',
        ]
      : [
          'https://natura-app-frontend.vercel.app', // Cambia por tu URL real cuando despliegues
          // Agrega aquí la URL donde despliegues tu frontend
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ✅ Configuración de sesión mejorada
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
      secure: !isDevelopment, // true en producción (HTTPS), false en desarrollo
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 día
      sameSite: isDevelopment ? 'lax' : 'none', // 'none' para cross-origin en producción
    },
  })
);

// ✅ Middleware para debugging en desarrollo
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      origin: req.headers.origin,
      sessionID: req.sessionID,
      hasSession: !!req.session?.user,
    });
    next();
  });
}

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/cuentas-contables', cuentasContablesRoutes);
app.use('/api/cuentas-pagar', cuentasPorPagarRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// ✅ Endpoint mejorado para check-session
app.get('/api/auth/check-session', (req, res) => {
  console.log('🔍 Checking session:', {
    sessionID: req.sessionID,
    hasUser: !!req.session?.user,
    cookies: req.headers.cookie,
  });

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
  console.log(
    `🔧 Environment: ${isDevelopment ? 'Development' : 'Production'}`
  );
  console.log(`🍪 Cookies secure: ${!isDevelopment}`);
});
