// routes/nomina.routes.js
// Rutas completas del módulo de nómina
import express from 'express';
import { verificarToken } from '../middlewares/auth.js';
import nominaController from '../controllers/nomina.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ============================================
// RUTAS DE EMPLEADOS
// ============================================

// Listar empleados
router.get('/empleados', nominaController.listarEmpleados);

// Obtener empleados para nómina (activos con salario configurado)
router.get(
  '/empleados/para-nomina',
  nominaController.obtenerEmpleadosParaNomina,
);

// Obtener empleado específico
router.get('/empleados/:id', nominaController.obtenerEmpleado);

// Crear empleado
router.post('/empleados', nominaController.crearEmpleado);

// Actualizar empleado
router.put('/empleados/:id', nominaController.actualizarEmpleado);

// Eliminar empleado (soft delete)
router.delete('/empleados/:id', nominaController.eliminarEmpleado);

// Configurar salario de empleado
router.post('/empleados/:id/salario', nominaController.configurarSalario);

// ============================================
// RUTAS DE CONCEPTOS
// ============================================

// Listar conceptos
router.get('/conceptos', nominaController.listarConceptos);

// Obtener percepciones
router.get('/conceptos/percepciones', nominaController.obtenerPercepciones);

// Obtener deducciones
router.get('/conceptos/deducciones', nominaController.obtenerDeducciones);

// Obtener concepto específico
router.get('/conceptos/:id', nominaController.obtenerConcepto);

// Crear concepto
router.post('/conceptos', nominaController.crearConcepto);

// Actualizar concepto
router.put('/conceptos/:id', nominaController.actualizarConcepto);

// Eliminar concepto (soft delete)
router.delete('/conceptos/:id', nominaController.eliminarConcepto);

// ============================================
// RUTAS DE NÓMINAS
// ============================================

// Listar nóminas
router.get('/nominas', nominaController.listarNominas);

// Obtener nómina específica (con detalle)
router.get('/nominas/:id', nominaController.obtenerNomina);

// Obtener detalle de nómina con movimientos
router.get('/nominas/:id/detalle', nominaController.obtenerDetalleNomina);

// Crear nómina (solo cabecera)
router.post('/nominas', nominaController.crearNomina);

// Calcular nómina (genera detalle y movimientos)
router.post('/nominas/:id/calcular', nominaController.calcularNomina);

// Recalcular nómina (elimina detalle y vuelve a calcular)
router.post('/nominas/:id/recalcular', nominaController.recalcularNomina);

// Aprobar nómina
router.put('/nominas/:id/aprobar', nominaController.aprobarNomina);

// Marcar nómina como pagada
router.put('/nominas/:id/pagar', nominaController.marcarComoPagada);

// Eliminar nómina (solo si está en borrador)
router.delete('/nominas/:id', nominaController.eliminarNomina);

// ============================================
// RUTAS DE PRÉSTAMOS
// ============================================

// Listar préstamos
router.get('/prestamos', nominaController.listarPrestamos);

// Crear préstamo
router.post('/prestamos', nominaController.crearPrestamo);

// Aprobar préstamo
router.put('/prestamos/:id/aprobar', nominaController.aprobarPrestamo);

// ============================================
// RUTAS DE AUSENCIAS
// ============================================

// Listar ausencias
router.get('/ausencias', nominaController.listarAusencias);

// Crear ausencia
router.post('/ausencias', nominaController.crearAusencia);

// Aprobar ausencia
router.put('/ausencias/:id/aprobar', nominaController.aprobarAusencia);

// Rechazar ausencia
router.put('/ausencias/:id/rechazar', nominaController.rechazarAusencia);

export default router;
