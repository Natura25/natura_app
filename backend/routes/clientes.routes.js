// routes/clientes.routes.js - COMPLETO (ES modules)
import express from 'express';
import ClientesController from '../controllers/clientes.controller.js';
import { verificarToken } from '../middlewares/auth.js';

const router = express.Router();

// ============= PROTEGER TODAS LAS RUTAS =============

router.use(verificarToken);

// ============= RUTAS ESPECIALES (antes de :id) =============

// GET /api/clientes/estadisticas - Estadísticas generales
router.get('/estadisticas', ClientesController.obtenerEstadisticas);

// GET /api/clientes/top - Top clientes por ventas
router.get('/top', ClientesController.obtenerTopClientes);

// GET /api/clientes/deuda - Clientes con deuda
router.get('/deuda', ClientesController.obtenerClientesConDeuda);

// GET /api/clientes/buscar - Buscar clientes
router.get('/buscar', ClientesController.buscar);

// ============= RUTAS BÁSICAS =============

// GET /api/clientes - Obtener todos los clientes
router.get('/', ClientesController.obtenerTodos);

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', ClientesController.obtenerPorId);

// POST /api/clientes - Crear nuevo cliente
router.post('/', ClientesController.crear);

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id', ClientesController.actualizar);

// DELETE /api/clientes/:id - Eliminar cliente (soft delete)
router.delete('/:id', ClientesController.eliminar);

export default router;
