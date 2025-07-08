import express from 'express';
import * as controller from '../controllers/cuentasContablesController.js';
import { verificarAdminMiddleware } from '../middlewares/verificarAdminMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.use(authMiddleware);

router.post('/', verificarAdminMiddleware, controller.crear);
router.get('/', controller.listar);
router.get('/:id', controller.ver);
router.put('/:id', verificarAdminMiddleware, controller.editar);
router.delete('/:id', verificarAdminMiddleware, controller.eliminar);

export default router;
