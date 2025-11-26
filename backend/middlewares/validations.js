// middleware/validation.js
import { validationResult } from 'express-validator';

// =============================================
// MIDDLEWARE DE VALIDACIONES
// =============================================

export const validarCampos = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const erroresFormateados = errors.array().map((err) => ({
      campo: err.path,
      valor: err.value,
      mensaje: err.msg,
      ubicacion: err.location, // body, query, params, etc.
    }));

    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: erroresFormateados,
      total_errores: erroresFormateados.length,
    });
  }

  next();
};

// =============================================
// VALIDACIONES COMUNES REUTILIZABLES
// =============================================

import { body, param, query } from 'express-validator';

// Validaciones para costos
export const validacionesCosto = [
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
];

// Validaciones para costos fijos
export const validacionesCostoFijo = [
  body('concepto')
    .notEmpty()
    .isLength({ min: 3, max: 100 })
    .withMessage('Concepto debe tener entre 3 y 100 caracteres'),
  body('monto')
    .isNumeric({ min: 0.01 })
    .withMessage('Monto debe ser un número mayor a 0'),
  body('frecuencia')
    .isIn(['mensual', 'trimestral', 'semestral', 'anual'])
    .withMessage('Frecuencia debe ser: mensual, trimestral, semestral o anual'),
  body('fecha_inicio')
    .isISO8601()
    .toDate()
    .withMessage('Fecha de inicio debe ser una fecha válida'),
];

// Validaciones para parámetros de URL
export const validarIdParam = [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
];

// Validaciones para queries de paginación
export const validarPaginacion = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100'),
];
