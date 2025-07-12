import express from 'express';
import * as controller from '../controllers/cuentasPorPagar.controller.js';
import { verificarAutenticado } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarAutenticado); // Protege todas las rutas

router.post('/', controller.crear);
router.get('/', controller.listar);
router.get('/:id', controller.ver);
router.put('/:id', controller.editar);
router.delete('/:id', controller.eliminar);

export default router;
