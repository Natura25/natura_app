// backend/routes/cuentasContables.routes.js - ACTUALIZADO

import express from 'express';
import * as controller from '../controllers/cuentasContablesController.js';
import { verificarToken } from '../middlewares/auth.js'; // Usa el middleware que ya tienes

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas públicas (para usuarios autenticados)
router.get('/', controller.listar);
router.get('/tipo/:tipo', controller.listarPorTipo);
router.get('/codigo/:codigo', controller.buscarPorCodigo);
router.get('/:id', controller.ver);

// Rutas que requieren permisos de admin (si tienes ese middleware)
// Si no tienes verificarAdminMiddleware, comenta estas líneas o usa verificarToken solamente
router.post('/', controller.crear);
router.put('/:id', controller.editar);
router.delete('/:id', controller.eliminar);
router.patch('/:id/activar', controller.activar);

export default router;
