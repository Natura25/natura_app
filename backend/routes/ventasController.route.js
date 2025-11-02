// backend/routes/ventas.routes.js - ORDEN CORRECTO

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
import { verificarToken } from '../middlewares/auth.js';

const router = Router();

// ============= PROTEGER TODAS LAS RUTAS =============
router.use(verificarToken);

// ============= RUTAS ESPECÍFICAS (ANTES DE /:id) =============

// Generar reportes de ventas
// GET /api/ventas/reportes?fecha_inicio=2024-01-01&fecha_fin=2024-12-31&forma_pago=contado&agrupado_por=dia
router.get('/reportes', getReporteVentas);

// ============= RUTAS DE CONSULTA =============

// Obtener todas las ventas con filtros opcionales
// GET /api/ventas?fecha_inicio=2024-01-01&fecha_fin=2024-12-31&forma_pago=contado&cliente_id=123
router.get('/', getVentas);

// Obtener una venta específica por ID
// ⚠️ IMPORTANTE: Esta ruta debe ir DESPUÉS de las rutas con nombres fijos
// GET /api/ventas/123
router.get('/:id', getVentaById);

// ============= RUTAS DE CREACIÓN =============

// Crear nueva venta (manual o directa)
// POST /api/ventas
router.post('/', createVenta);

// ============= RUTAS DE ACTUALIZACIÓN =============

// Anular una venta (recomendado sobre eliminar)
// ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de PUT /:id
// PATCH /api/ventas/123/anular
router.patch('/:id/anular', anularVenta);

// Actualizar una venta existente
// PUT /api/ventas/123
router.put('/:id', updateVenta);

// ============= RUTAS DE ELIMINACIÓN =============

// Eliminar una venta completamente (usar con precaución)
// DELETE /api/ventas/123
router.delete('/:id', deleteVenta);

export default router;
