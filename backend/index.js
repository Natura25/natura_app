import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authController.route.js';
import ventasRoutes from './routes/ventasController.route.js';
import cuentasRoutes from './routes/cuentasPorCobrar.route.js';
import cuentasContablesRoutes from './routes/cuentasContables.route.js';
import cuentasPorPagarRoutes from './routes/cuentasPorPagar.route.js';
import inventarioRoutes from './routes/inventario.route.js';
import costosRoutes from './routes/costos.route.js';

const app = express();

app.use(express.json());

// ✅ CORS SIMPLIFICADO para JWT (no necesitas cookies)
console.log('🔧 Setting up CORS...');
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://localhost:5173',
    ],
    // credentials: true, ← YA NO NECESITAS ESTO
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], // ← Solo necesitas Authorization
  })
);

//! Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/contabilidad', cuentasContablesRoutes);
app.use('/api/cuentas-pagar', cuentasPorPagarRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/costos', costosRoutes);

import expressListEndpoints from 'express-list-endpoints';

console.log('📋 Rutas detectadas:');
console.table(expressListEndpoints(app));

// Puerto
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Server is running on port ${PORT}`);
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
});
