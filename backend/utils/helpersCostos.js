//! =============================================
//! FUNCIONES DE UTILIDAD
//! =============================================

export function determinarEstadoVigencia(fechaVigencia, fechaVencimiento) {
  const hoy = new Date();
  const vigencia = new Date(fechaVigencia);
  const vencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;

  if (vigencia > hoy) return 'futuro';
  if (vencimiento && vencimiento < hoy) return 'vencido';
  return 'vigente';
}

export function determinarEstadoVigenciaCostoFijo(fechaInicio, fechaFin) {
  const hoy = new Date();
  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : null;

  if (inicio > hoy) return 'futuro';
  if (fin && fin < hoy) return 'vencido';
  return 'vigente';
}

export function calcularDiasVigente(fechaVigencia, fechaVencimiento) {
  const vigencia = new Date(fechaVigencia);
  const vencimiento = fechaVencimiento
    ? new Date(fechaVencimiento)
    : new Date();
  return Math.ceil((vencimiento - vigencia) / (1000 * 60 * 60 * 24));
}

export function calcularImpactoMensual(monto, frecuencia) {
  const montoNum = parseFloat(monto);
  switch (frecuencia) {
    case 'mensual':
      return montoNum;
    case 'trimestral':
      return montoNum / 3;
    case 'semestral':
      return montoNum / 6;
    case 'anual':
      return montoNum / 12;
    default:
      return 0;
  }
}

export function calcularEstadisticasHistorial(costos) {
  if (costos.length === 0) return {};

  const costosConPrecio = costos.filter((c) => c.precio_venta);

  return {
    total_versiones: costos.length,
    costo_actual: costos[0].costo_unitario,
    costo_promedio: (
      costos.reduce((sum, c) => sum + parseFloat(c.costo_unitario), 0) /
      costos.length
    ).toFixed(2),
    costo_minimo: Math.min(...costos.map((c) => parseFloat(c.costo_unitario))),
    costo_maximo: Math.max(...costos.map((c) => parseFloat(c.costo_unitario))),
    margen_promedio:
      costosConPrecio.length > 0
        ? (
            costosConPrecio.reduce((sum, c) => {
              const margen =
                ((c.precio_venta - c.costo_unitario) / c.precio_venta) * 100;
              return sum + margen;
            }, 0) / costosConPrecio.length
          ).toFixed(2)
        : null,
    periodo_total_dias: calcularDiasVigente(
      costos[costos.length - 1].fecha_vigencia,
      costos[0].fecha_vencimiento
    ),
  };
}
