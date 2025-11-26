import { Router } from 'express';

import {
  getAll,
  getById,
  createCuenta,
  updateCuenta,
  deleteCuenta,
  registrarPago,
  getDashboard,
  marcarVencidas,
  getHistorialPagos,
  getByCliente,
} from '../controllers/cuentasPorCobrarController.js';
import { verificarToken } from '../middlewares/auth.js';

const router = Router();

router.use(verificarToken);

// Dashboard y reportes (DEBEN IR PRIMERO)
router.get('/dashboard', getDashboard);
router.post('/marcar-vencidas', marcarVencidas);

// Consultas por cliente
router.get('/cliente/:cliente_id', getByCliente);

// CRUD básico
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', createCuenta);
router.put('/:id', updateCuenta);
router.delete('/:id', deleteCuenta);

// Pagos
router.post('/:id/pagar', registrarPago);
router.get('/:id/pagos', getHistorialPagos);

export default router;
