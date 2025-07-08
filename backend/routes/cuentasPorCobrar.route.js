import { Router } from 'express';

import {
  getAll,
  getById,
  createCuenta,
} from '../controllers/cuentasPorCobrarController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', createCuenta);

export default router;
