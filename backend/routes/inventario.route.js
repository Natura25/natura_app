import express from 'express';
import { verificarToken } from '../middlewares/auth.js';
import inventarioController from '../controllers/inventario.controller.js';

const router = express.Router();

//! Todas las rutas requieren autenticación
router.use(verificarToken);

//! ====================================
//! RUTAS DE PRODUCTOS
//! ====================================

// Obtener todos los productos (con paginación y filtros opcionales)
router.get('/productos', inventarioController.obtenerProductos);

// Obtener un producto específico por ID
router.get('/productos/:id', inventarioController.obtenerProductoPorId);

// Crear nuevo producto
router.post('/productos', inventarioController.crearProducto);

// Actualizar producto
router.put('/productos/:id', inventarioController.actualizarProducto);

// Eliminar producto
router.delete('/productos/:id', inventarioController.eliminarProducto);

//! ====================================
//! RUTAS DE MOVIMIENTOS
//! ====================================

// Obtener todos los movimientos
router.get('/movimientos', inventarioController.obtenerMovimientos);

// Registrar entrada de inventario
router.post('/movimientos/entrada', inventarioController.registrarEntrada);

// Registrar salida de inventario
router.post('/movimientos/salida', inventarioController.registrarSalida);

// Registrar ajuste de inventario
router.post('/movimientos/ajuste', inventarioController.registrarAjuste);

//! ====================================
//! RUTAS DE REPORTES
//! ====================================

// Generar reporte de inventario (PDF o Excel)
router.get('/reportes/inventario', inventarioController.reporteInventario);

// Generar reporte de movimientos (PDF o Excel)
router.get('/reportes/movimientos', inventarioController.reporteMovimientos);

//! ====================================
//! RUTAS DE ALERTAS
//! ====================================

// Obtener productos con stock bajo
router.get('/alertas/stock-bajo', inventarioController.obtenerAlertasStock);

export default router;
