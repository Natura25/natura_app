import { Router } from 'express';
import {
  getVentas,
  getVentaById,
  createVenta,
} from '../controllers/VentasController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware); // proteger todas las rutas de ventas

router.get('/', getVentas);
router.get('/:id', getVentaById);
router.post('/', createVenta); // sirve tanto para manual como directa

export default router;
