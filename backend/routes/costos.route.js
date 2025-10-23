// =============================================
// RUTAS PARA MÓDULO DE COSTOS
// =============================================

import { Router } from 'express';
import {
  registrarCosto,
  consultarCostos,
  historialCostosProducto,
  actualizarCosto,
  eliminarCosto,
} from '../controllers/costosController.js';
import { supabase } from '../config/supabase.js';
import { consultarCostosFijos } from '../controllers/costosFijosController.js';
import { registrarCostoFijo } from '../controllers/costosFijosController.js';

import { verificarToken, verificarPermisos } from '../middlewares/auth.js';
import { validarCampos } from '../middlewares/validations.js';
import { body, param, query } from 'express-validator';

const router = Router();

// =============================================
// MIDDLEWARE GLOBAL PARA TODAS LAS RUTAS
// =============================================
router.use(verificarToken);

// =============================================
// RUTAS DE COSTOS VARIABLES
// =============================================

/**
 * @route POST /api/costos
 * @desc Registrar nuevo costo
 * @access Private - Requiere permisos de escritura
 */
router.post(
  '/',
  // verificarPermisos(['costos:escribir', 'costos:admin']), // 👈 Comentado para pruebas
  [
    body('producto_servicio_id')
      .isUUID()
      .withMessage('ID de producto debe ser un UUID válido'),
    body('costo_unitario')
      .isNumeric({ min: 0.01 })
      .withMessage('Costo unitario debe ser un número mayor a 0'),
    body('precio_venta')
      .optional({ nullable: true })
      .isNumeric({ min: 0.01 })
      .withMessage('Precio de venta debe ser un número mayor a 0'),
    body('tipo_costo')
      .isIn(['fijo', 'variable'])
      .withMessage('Tipo de costo debe ser "fijo" o "variable"'),
    body('fecha_vigencia')
      .isISO8601()
      .toDate()
      .withMessage('Fecha de vigencia debe ser una fecha válida'),
    body('fecha_vencimiento')
      .optional({ nullable: true })
      .isISO8601()
      .toDate()
      .withMessage('Fecha de vencimiento debe ser una fecha válida'),
    body('moneda')
      .optional()
      .isIn(['DOP', 'USD', 'EUR'])
      .withMessage('Moneda debe ser DOP, USD o EUR'),
    body('observaciones')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Observaciones no pueden exceder 500 caracteres'),
  ],
  validarCampos,
  registrarCosto
);

/**
 * @route GET /api/costos
 * @desc Consultar costos con filtros
 * @access Private - Requiere permisos de lectura
 */
// router.get(
//   '/',
//   verificarPermisos(['costos:leer', 'costos:escribir', 'costos:admin']),
//   validarPaginacion,
//   [
//     query('producto_id').optional().isUUID(),
//     query('tipo_costo').optional().isIn(['fijo', 'variable', 'todos']),
//     query('fecha_desde').optional().isISO8601(),
//     query('fecha_hasta').optional().isISO8601(),
//     query('solo_vigentes').optional().isIn(['true', 'false']),
//   ],
//   validarCampos,
//   consultarCostos
// );

/**
 * @route GET /api/costos/producto/:producto_id/historial
 * @desc Obtener historial de costos de un producto
 * @access Private - Requiere permisos de lectura
 */
router.get(
  '/producto/:producto_id/historial',
  verificarPermisos(['costos:leer', 'costos:escribir', 'costos:admin']),
  [
    param('producto_id')
      .isUUID()
      .withMessage('ID de producto debe ser un UUID válido'),
  ],
  validarCampos,
  historialCostosProducto
);

/**
 * @route PUT /api/costos/:id
 * @desc Actualizar costo existente
 * @access Private - Requiere permisos de escritura
 */
router.put(
  '/:id',
  verificarPermisos(['costos:escribir', 'costos:admin']),
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido'),
    body('costo_unitario')
      .optional()
      .isNumeric({ min: 0.01 })
      .withMessage('Costo unitario debe ser un número mayor a 0'),
    body('precio_venta')
      .optional({ nullable: true })
      .isNumeric({ min: 0.01 })
      .withMessage('Precio de venta debe ser un número mayor a 0'),
    body('tipo_costo')
      .optional()
      .isIn(['fijo', 'variable'])
      .withMessage('Tipo de costo debe ser "fijo" o "variable"'),
    body('fecha_vigencia')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Fecha de vigencia debe ser una fecha válida'),
    body('fecha_vencimiento')
      .optional({ nullable: true })
      .isISO8601()
      .toDate()
      .withMessage('Fecha de vencimiento debe ser una fecha válida'),
    body('observaciones')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Observaciones no pueden exceder 500 caracteres'),
  ],
  validarCampos,
  actualizarCosto
);

/**
 * @route DELETE /api/costos/:id
 * @desc Eliminar costo (soft delete)
 * @access Private - Requiere permisos de administrador
 */
router.delete(
  '/:id',
  verificarPermisos(['costos:admin']),
  [param('id').isUUID().withMessage('ID debe ser un UUID válido')],
  validarCampos,
  eliminarCosto
);

// =============================================
// RUTAS DE COSTOS FIJOS
// =============================================

/**
 * @route POST /api/costos/fijos
 * @desc Registrar nuevo costo fijo
 * @access Private - Requiere permisos de escritura
 */
router.post(
  '/fijos',
  verificarPermisos(['costos:escribir', 'costos:admin']),
  [
    body('concepto')
      .notEmpty()
      .isLength({ min: 3, max: 100 })
      .withMessage('Concepto debe tener entre 3 y 100 caracteres'),
    body('descripcion')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Descripción no puede exceder 255 caracteres'),
    body('monto')
      .isNumeric({ min: 0.01 })
      .withMessage('Monto debe ser un número mayor a 0'),
    body('frecuencia')
      .isIn(['mensual', 'trimestral', 'semestral', 'anual'])
      .withMessage(
        'Frecuencia debe ser: mensual, trimestral, semestral o anual'
      ),
    body('fecha_inicio')
      .isISO8601()
      .toDate()
      .withMessage('Fecha de inicio debe ser una fecha válida'),
    body('fecha_fin')
      .optional({ nullable: true })
      .isISO8601()
      .toDate()
      .withMessage('Fecha de fin debe ser una fecha válida'),
    body('categoria')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Categoría no puede exceder 50 caracteres'),
  ],
  validarCampos,
  registrarCostoFijo
);

/**
 * @route GET /api/costos/fijos
 * @desc Consultar costos fijos
 * @access Private - Requiere permisos de lectura
 */
router.get(
  '/fijos',
  verificarPermisos(['costos:leer', 'costos:escribir', 'costos:admin']),
  [
    query('estado')
      .optional()
      .isIn(['activo', 'inactivo', 'todos'])
      .withMessage('Estado debe ser "activo", "inactivo" o "todos"'),
    query('categoria')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Categoría no puede exceder 50 caracteres'),
    query('frecuencia')
      .optional()
      .isIn(['mensual', 'trimestral', 'semestral', 'anual', 'todas'])
      .withMessage(
        'Frecuencia debe ser: mensual, trimestral, semestral, anual o todas'
      ),
    query('fecha_referencia')
      .optional()
      .isISO8601()
      .withMessage('Fecha de referencia debe ser una fecha válida'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página debe ser un número entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe ser un número entre 1 y 100'),
  ],
  validarCampos,
  consultarCostosFijos
);

// =============================================
// RUTAS DE REPORTES Y ANÁLISIS
// =============================================

/**
 * @route GET /api/costos/reportes/resumen
 * @desc Obtener resumen de costos por período
 * @access Private - Requiere permisos de lectura
 */
router.get(
  '/reportes/resumen',
  verificarPermisos(['costos:leer', 'costos:escribir', 'costos:admin']),
  [
    query('fecha_desde')
      .optional()
      .isISO8601()
      .withMessage('Fecha desde debe ser una fecha válida'),
    query('fecha_hasta')
      .optional()
      .isISO8601()
      .withMessage('Fecha hasta debe ser una fecha válida'),
    query('agrupar_por')
      .optional()
      .isIn(['mes', 'trimestre', 'año', 'categoria', 'tipo'])
      .withMessage(
        'Agrupar por debe ser: mes, trimestre, año, categoria o tipo'
      ),
  ],
  validarCampos,
  async (req, res) => {
    // Este controlador se puede implementar después
    res.json({ message: 'Endpoint de reportes - próximamente' });
  }
);

/**
 * @route GET /api/costos/analisis/margen
 * @desc Análisis de márgenes de ganancia
 * @access Private - Requiere permisos de lectura
 */
router.get(
  '/analisis/margen',
  verificarPermisos(['costos:leer', 'costos:escribir', 'costos:admin']),
  [
    query('categoria_id')
      .optional()
      .isUUID()
      .withMessage('ID de categoría debe ser un UUID válido'),
    query('margen_minimo')
      .optional()
      .isNumeric({ min: 0 })
      .withMessage('Margen mínimo debe ser un número mayor o igual a 0'),
    query('solo_productos_con_precio')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('Solo productos con precio debe ser true o false'),
  ],
  validarCampos,
  async (req, res) => {
    // Este controlador se puede implementar después
    res.json({ message: 'Endpoint de análisis de márgenes - próximamente' });
  }
);

// =============================================
// RUTAS DE UTILIDAD
// =============================================

/**
 * @route GET /api/costos/utilidades/categorias
 * @desc Obtener lista de categorías de costos fijos
 * @access Private
 */
router.get(
  '/utilidades/categorias',
  verificarPermisos(['costos:leer', 'costos:escribir', 'costos:admin']),
  async (req, res) => {
    try {
      // Obtener categorías únicas de costos fijos
      const { data, error } = await supabase
        .from('costos_fijos')
        .select('categoria')
        .not('categoria', 'is', null)
        .order('categoria');

      if (error) throw error;

      const categorias = [...new Set(data.map((item) => item.categoria))];

      res.json({
        data: categorias,
        total: categorias.length,
      });
    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

/**
 * @route GET /api/costos/utilidades/monedas
 * @desc Obtener lista de monedas soportadas
 * @access Private
 */
router.get(
  '/utilidades/monedas',
  verificarPermisos(['costos:leer', 'costos:escribir', 'costos:admin']),
  (req, res) => {
    res.json({
      data: [
        { codigo: 'DOP', nombre: 'Peso Dominicano', simbolo: 'RD$' },
        { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$' },
        { codigo: 'EUR', nombre: 'Euro', simbolo: '€' },
      ],
    });
  }
);

export default router;
