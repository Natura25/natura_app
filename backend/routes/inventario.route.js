import express from 'express';
import controller from '../controllers/inventarioController.js';
//import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

//! Middleware de autenticación

//! CRUD Productos
router.post('/productos', controller.crearProducto);
router.put('/productos/:id', controller.actualizarProducto);
router.get('/productos', controller.listarProductos);

//! Movimientos
router.post('/movimientos/entradas', controller.registrarEntrada);
router.post('/movimientos/salidas', controller.registrarSalida);
router.post('/movimientos/ajustes', controller.registrarAjuste);

//! Reportes
router.get('/inventario', controller.reporteInventario);
router.get('/movimientos', controller.reporteMovimientos);

//! Alertas
router.get('/alertas/stock-bajo', controller.obtenerAlertasStock);

export default router;
