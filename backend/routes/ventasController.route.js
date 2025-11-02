import { Router } from 'express';
import {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta,
  anularVenta,
  getReporteVentas,
} from '../controllers/ventasController.js';
import { verificarToken } from '../middlewares/auth.js'; // Usa el middleware correcto

const router = Router();

// Proteger todas las rutas de ventas

router.use(verificarToken);

// ============= RUTAS DE CONSULTA =============

// Obtener todas las ventas con filtros opcionales
// GET /api/ventas?fecha_inicio=2024-01-01&fecha_fin=2024-12-31&forma_pago=contado&cliente_id=123&estado=activa
router.get('/', getVentas);

// Generar reportes de ventas
// GET /api/ventas/reportes?fecha_inicio=2024-01-01&fecha_fin=2024-12-31&forma_pago=contado&agrupado_por=dia
router.get('/reportes', getReporteVentas);

// Obtener una venta específica por ID
// GET /api/ventas/123
router.get('/:id', getVentaById);

// ============= RUTAS DE CREACIÓN =============

// Crear nueva venta (manual o directa)
// POST /api/ventas
router.post('/', createVenta);

// ============= RUTAS DE ACTUALIZACIÓN =============

// Actualizar una venta existente
// PUT /api/ventas/123
router.put('/:id', updateVenta);

// Anular una venta (recomendado sobre eliminar)
// PATCH /api/ventas/123/anular
router.patch('/:id/anular', anularVenta);

// ============= RUTAS DE ELIMINACIÓN =============

// Eliminar una venta completamente (usar con precaución)
// DELETE /api/ventas/123
router.delete('/:id', deleteVenta);

export default router;
