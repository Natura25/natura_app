// validators/nominaValidator.js
// Validaciones para el módulo de nómina

/**
 * Validar datos de empleado
 */
export function validarEmpleado(datos) {
  const errores = [];

  // Campos requeridos
  if (!datos.nombres || datos.nombres.trim() === '') {
    errores.push('Nombres es requerido');
  }
  if (!datos.apellidos || datos.apellidos.trim() === '') {
    errores.push('Apellidos es requerido');
  }
  if (!datos.cedula || datos.cedula.trim() === '') {
    errores.push('Cédula es requerida');
  }
  if (!datos.fecha_ingreso) {
    errores.push('Fecha de ingreso es requerida');
  }
  if (!datos.puesto || datos.puesto.trim() === '') {
    errores.push('Puesto es requerido');
  }

  // Validar formato de cédula (dominicana: 001-1234567-8)
  if (
    datos.cedula &&
    !/^\d{3}-?\d{7}-?\d{1}$/.test(datos.cedula.replace(/-/g, ''))
  ) {
    errores.push('Formato de cédula inválido. Use: 001-1234567-8');
  }

  // Validar email si existe
  if (datos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
    errores.push('Formato de email inválido');
  }

  // Validar fecha de ingreso no sea futura
  if (datos.fecha_ingreso && new Date(datos.fecha_ingreso) > new Date()) {
    errores.push('La fecha de ingreso no puede ser futura');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar configuración salarial
 */
export function validarConfiguracionSalarial(datos) {
  const errores = [];

  if (!datos.empleado_id) {
    errores.push('ID de empleado es requerido');
  }
  if (!datos.salario_base || datos.salario_base <= 0) {
    errores.push('Salario base debe ser mayor a 0');
  }
  if (!datos.periodo_pago) {
    errores.push('Período de pago es requerido');
  }
  if (
    datos.periodo_pago &&
    !['semanal', 'quincenal', 'mensual'].includes(datos.periodo_pago)
  ) {
    errores.push('Período de pago inválido');
  }

  // Validar salario mínimo (RD dominicana 2024: RD$21,000 mensual aprox)
  const salarioMinimo =
    datos.periodo_pago === 'mensual'
      ? 21000
      : datos.periodo_pago === 'quincenal'
        ? 10500
        : 5250;

  if (datos.salario_base < salarioMinimo) {
    errores.push(
      `Salario base está por debajo del mínimo (RD$${salarioMinimo} ${datos.periodo_pago})`,
    );
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar datos de nómina
 */
export function validarNomina(datos) {
  const errores = [];

  if (!datos.periodo_inicio) {
    errores.push('Período de inicio es requerido');
  }
  if (!datos.periodo_fin) {
    errores.push('Período de fin es requerido');
  }
  if (!datos.tipo_periodo) {
    errores.push('Tipo de período es requerido');
  }

  // Validar que periodo_fin sea después de periodo_inicio
  if (datos.periodo_inicio && datos.periodo_fin) {
    if (new Date(datos.periodo_fin) <= new Date(datos.periodo_inicio)) {
      errores.push('La fecha de fin debe ser posterior a la de inicio');
    }
  }

  // Validar tipo de período
  if (
    datos.tipo_periodo &&
    !['semanal', 'quincenal', 'mensual', 'extraordinaria'].includes(
      datos.tipo_periodo,
    )
  ) {
    errores.push('Tipo de período inválido');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar datos para calcular nómina
 */
export function validarCalculoNomina(datos) {
  const errores = [];

  if (
    !datos.empleados ||
    !Array.isArray(datos.empleados) ||
    datos.empleados.length === 0
  ) {
    errores.push('Debe incluir al menos un empleado');
  }

  // Validar cada empleado
  if (datos.empleados && Array.isArray(datos.empleados)) {
    datos.empleados.forEach((emp, index) => {
      if (!emp.empleado_id) {
        errores.push(`Empleado ${index + 1}: ID requerido`);
      }
      if (!emp.salario_base || emp.salario_base <= 0) {
        errores.push(`Empleado ${index + 1}: Salario base inválido`);
      }
      if (
        emp.dias_trabajados !== undefined &&
        (emp.dias_trabajados < 0 || emp.dias_trabajados > 31)
      ) {
        errores.push(`Empleado ${index + 1}: Días trabajados inválido (0-31)`);
      }
      if (
        emp.dias_ausencias !== undefined &&
        (emp.dias_ausencias < 0 || emp.dias_ausencias > 31)
      ) {
        errores.push(`Empleado ${index + 1}: Días de ausencia inválido (0-31)`);
      }
      if (emp.horas_extras !== undefined && emp.horas_extras < 0) {
        errores.push(
          `Empleado ${index + 1}: Horas extras no puede ser negativo`,
        );
      }
    });
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar préstamo
 */
export function validarPrestamo(datos) {
  const errores = [];

  if (!datos.empleado_id) {
    errores.push('ID de empleado es requerido');
  }
  if (!datos.monto_total || datos.monto_total <= 0) {
    errores.push('Monto total debe ser mayor a 0');
  }
  if (!datos.numero_cuotas || datos.numero_cuotas <= 0) {
    errores.push('Número de cuotas debe ser mayor a 0');
  }
  if (datos.numero_cuotas > 60) {
    errores.push('Número de cuotas no puede exceder 60');
  }
  if (datos.tasa_interes !== undefined && datos.tasa_interes < 0) {
    errores.push('Tasa de interés no puede ser negativa');
  }
  if (!datos.fecha_primer_descuento) {
    errores.push('Fecha de primer descuento es requerida');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar ausencia
 */
export function validarAusencia(datos) {
  const errores = [];

  if (!datos.empleado_id) {
    errores.push('ID de empleado es requerido');
  }
  if (!datos.tipo) {
    errores.push('Tipo de ausencia es requerido');
  }
  if (!datos.fecha_inicio) {
    errores.push('Fecha de inicio es requerida');
  }
  if (!datos.fecha_fin) {
    errores.push('Fecha de fin es requerida');
  }

  // Validar que fecha_fin sea después de fecha_inicio
  if (datos.fecha_inicio && datos.fecha_fin) {
    if (new Date(datos.fecha_fin) < new Date(datos.fecha_inicio)) {
      errores.push('La fecha de fin debe ser posterior o igual a la de inicio');
    }
  }

  // Validar tipos válidos
  const tiposValidos = [
    'falta',
    'vacaciones',
    'permiso',
    'licencia_medica',
    'incapacidad',
    'suspension',
    'licencia_paternidad',
    'licencia_maternidad',
    'duelo',
    'otro',
  ];
  if (datos.tipo && !tiposValidos.includes(datos.tipo)) {
    errores.push('Tipo de ausencia inválido');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar asistencia
 */
export function validarAsistencia(datos) {
  const errores = [];

  if (!datos.empleado_id) {
    errores.push('ID de empleado es requerido');
  }
  if (!datos.fecha) {
    errores.push('Fecha es requerida');
  }

  // Validar formato de hora si existe
  const horaRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  if (datos.hora_entrada && !horaRegex.test(datos.hora_entrada)) {
    errores.push('Formato de hora de entrada inválido (HH:MM:SS)');
  }
  if (datos.hora_salida && !horaRegex.test(datos.hora_salida)) {
    errores.push('Formato de hora de salida inválido (HH:MM:SS)');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Middleware para validar datos antes de procesar
 */
export function validarMiddleware(tipoValidacion) {
  return (req, res, next) => {
    let resultado;

    switch (tipoValidacion) {
      case 'empleado':
        resultado = validarEmpleado(req.body);
        break;
      case 'configuracion_salarial':
        resultado = validarConfiguracionSalarial(req.body);
        break;
      case 'nomina':
        resultado = validarNomina(req.body);
        break;
      case 'calculo_nomina':
        resultado = validarCalculoNomina(req.body);
        break;
      case 'prestamo':
        resultado = validarPrestamo(req.body);
        break;
      case 'ausencia':
        resultado = validarAusencia(req.body);
        break;
      case 'asistencia':
        resultado = validarAsistencia(req.body);
        break;
      default:
        return next();
    }

    if (!resultado.valido) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: resultado.errores,
      });
    }

    next();
  };
}

export default {
  validarEmpleado,
  validarConfiguracionSalarial,
  validarNomina,
  validarCalculoNomina,
  validarPrestamo,
  validarAusencia,
  validarAsistencia,
  validarMiddleware,
};
