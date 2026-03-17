// routes/asistencia.routes.js
// Rutas para control de asistencias y horarios
import express from 'express';
import { verificarToken } from '../middlewares/auth.js';
import asistenciaController from '../controllers/asistenciaController.js';
import { validarMiddleware } from '../validators/nominaValidator.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ============================================
// RUTAS DE ASISTENCIAS
// ============================================

// Listar asistencias
router.get('/', asistenciaController.listar);

// Registrar asistencia (entrada o salida automático)
router.post(
  '/',
  validarMiddleware('asistencia'),
  asistenciaController.registrar,
);

// Marcar ausencia/falta
router.post('/ausencia', asistenciaController.marcarAusencia);

// Justificar ausencia
router.put('/:id/justificar', asistenciaController.justificar);

// Obtener resumen de asistencias de un empleado
router.get(
  '/empleado/:empleado_id/resumen',
  asistenciaController.obtenerResumen,
);

// Obtener horas extras para nómina
router.get(
  '/empleado/:empleado_id/horas-extras',
  asistenciaController.obtenerHorasExtras,
);

// Reporte por departamento
router.get(
  '/departamento/:departamento_id/reporte',
  asistenciaController.reportePorDepartamento,
);

// ============================================
// RUTAS PARA APP MÓVIL
// ============================================

// Registrar entrada desde móvil
router.post('/movil/entrada', asistenciaController.registrarEntradaMovil);

// Registrar salida desde móvil
router.post('/movil/salida', asistenciaController.registrarSalidaMovil);

export default router;
