// routes/prestamo.routes.js
// Rutas para gestión de préstamos a empleados
import express from 'express';
import { verificarToken } from '../middlewares/auth.js';
import prestamoController from '../controllers/prestamoController.js';
import { validarMiddleware } from '../validators/nominaValidator.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ============================================
// RUTAS DE PRÉSTAMOS
// ============================================

// Listar préstamos
router.get('/', prestamoController.listar);

// Reporte de préstamos
router.get('/reporte', prestamoController.obtenerReporte);

// Calcular cuota
router.post('/calcular-cuota', prestamoController.calcularCuota);

// Obtener préstamo por ID
router.get('/:id', prestamoController.obtenerPorId);

// Crear préstamo
router.post('/', validarMiddleware('prestamo'), prestamoController.crear);

// Aprobar préstamo
router.put('/:id/aprobar', prestamoController.aprobar);

// Rechazar préstamo
router.put('/:id/rechazar', prestamoController.rechazar);

// Liquidar préstamo
router.put('/:id/liquidar', prestamoController.liquidar);

// Obtener cuotas de un préstamo
router.get('/:id/cuotas', prestamoController.obtenerCuotas);

// Obtener préstamos activos de un empleado
router.get(
  '/empleado/:empleado_id/activos',
  prestamoController.obtenerActivosEmpleado,
);

export default router;
