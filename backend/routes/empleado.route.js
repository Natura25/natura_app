// routes/empleado.routes.js
// Rutas específicas para gestión de empleados
import express from 'express';
import { verificarToken } from '../middlewares/auth.js';
import empleadoController from '../controllers/empleadoController.js';
import { validarMiddleware } from '../validators/nominaValidator.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ============================================
// RUTAS DE EMPLEADOS
// ============================================

// Listar empleados
router.get('/', empleadoController.listar);

// Buscar empleados
router.get('/buscar', empleadoController.buscar);

// Estadísticas
router.get('/estadisticas', empleadoController.obtenerEstadisticas);

// Empleados para nómina
router.get('/para-nomina', empleadoController.obtenerParaNomina);

// Obtener empleado por ID
router.get('/:id', empleadoController.obtenerPorId);

// Crear empleado
router.post('/', validarMiddleware('empleado'), empleadoController.crear);

// Actualizar empleado
router.put('/:id', empleadoController.actualizar);

// Eliminar empleado
router.delete('/:id', empleadoController.eliminar);

// ============================================
// CONFIGURACIÓN SALARIAL
// ============================================

// Configurar salario
router.post(
  '/:id/salario',
  validarMiddleware('configuracion_salarial'),
  empleadoController.configurarSalario,
);

// Historial de salarios
router.get(
  '/:id/salario/historial',
  empleadoController.obtenerHistorialSalario,
);

// Aumento masivo
router.post('/salario/aumento-masivo', empleadoController.aplicarAumentoMasivo);

export default router;
