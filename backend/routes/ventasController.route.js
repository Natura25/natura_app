// backend/routes/ventas.routes.js - CON PERMISOS

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
import {
  verificarToken,
  verificarPermisos,
  verificarRol,
} from '../middlewares/auth.js';

const router = Router();

// ============= PROTEGER TODAS LAS RUTAS =============
router.use(verificarToken);

// ============= RUTAS ESPECÍFICAS (ANTES DE /:id) =============

/**
 * GET /api/ventas/reportes
 * Generar reportes de ventas
 * Requiere permisos de lectura o admin
 */
router.get(
  '/reportes',
  verificarPermisos(['ventas:leer', 'ventas:admin', '*']),
  getReporteVentas
);

// ============= RUTAS DE CONSULTA =============

/**
 * GET /api/ventas
 * Obtener todas las ventas con filtros opcionales
 * Query params: fecha_inicio, fecha_fin, forma_pago, cliente_id
 */
router.get(
  '/',
  verificarPermisos(['ventas:leer', 'ventas:admin', '*']),
  getVentas
);

/**
 * GET /api/ventas/:id
 * Obtener una venta específica por ID
 * ⚠️ IMPORTANTE: Esta ruta debe ir DESPUÉS de las rutas con nombres fijos
 */
router.get(
  '/:id',
  verificarPermisos(['ventas:leer', 'ventas:admin', '*']),
  getVentaById
);

// ============= RUTAS DE CREACIÓN =============

/**
 * POST /api/ventas
 * Crear nueva venta (manual o directa)
 * Requiere permisos de escritura
 */
router.post(
  '/',
  verificarPermisos(['ventas:crear', 'ventas:admin', '*']),
  createVenta
);

// ============= RUTAS DE ACTUALIZACIÓN =============

/**
 * PATCH /api/ventas/:id/anular
 * Anular una venta (recomendado sobre eliminar)
 * ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de PUT /:id
 * Requiere permisos de admin o supervisor
 */
router.patch(
  '/:id/anular',
  verificarPermisos(['ventas:admin', '*']),
  anularVenta
);

/**
 * PUT /api/ventas/:id
 * Actualizar una venta existente
 * Requiere permisos de escritura o admin
 */
router.put(
  '/:id',
  verificarPermisos(['ventas:editar', 'ventas:admin', '*']),
  updateVenta
);

// ============= RUTAS DE ELIMINACIÓN =============

/**
 * DELETE /api/ventas/:id
 * Eliminar una venta completamente (usar con precaución)
 * Solo admin puede eliminar
 */
router.delete(
  '/:id',
  verificarRol('admin'), // O verificarPermisos(['ventas:admin', '*'])
  deleteVenta
);

export default router;
