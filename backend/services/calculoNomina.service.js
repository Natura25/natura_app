// services/calculoNomina.service.js
// Servicio con toda la lógica de cálculo de nómina
// Incluye cálculos de AFP, SFS, ISR, horas extras, etc.

export default {
  /**
   * Calcular nómina para un empleado individual
   */
  async calcularNominaEmpleado(empleado, conceptosFijos, datosNomina) {
    try {
      const movimientos = [];
      let totalPercepciones = 0;
      let totalDeducciones = 0;

      // Determinar días del período
      const diasPeriodo = this.calcularDiasPeriodo(datosNomina.tipo_periodo);
      const diasTrabajados = empleado.dias_trabajados || diasPeriodo;
      const diasAusencias = empleado.dias_ausencias || 0;
      const diasPagados = diasTrabajados - diasAusencias;

      // 1. SALARIO BASE
      const salarioBase = (empleado.salario_base / diasPeriodo) * diasPagados;

      const conceptoSalarioBase = conceptosFijos.find(
        (c) => c.codigo === 'SAL_BASE',
      );
      movimientos.push({
        concepto_id: conceptoSalarioBase?.id,
        concepto_codigo: 'SAL_BASE',
        concepto_nombre: 'Salario Base',
        tipo: 'percepcion',
        categoria: 'salario',
        base_calculo: empleado.salario_base,
        monto: this.redondear(salarioBase),
        es_fijo: true,
        es_gravable: true,
        orden: 1,
      });

      totalPercepciones += salarioBase;

      // 2. HORAS EXTRAS (si las hay)
      if (empleado.horas_extras > 0) {
        const valorHora = empleado.salario_base / (diasPeriodo * 8);
        const montoHorasExtras = valorHora * empleado.horas_extras * 1.35; // 35% recargo

        const conceptoHorasExtras = conceptosFijos.find(
          (c) => c.codigo === 'HORAS_EXT',
        );
        movimientos.push({
          concepto_id: conceptoHorasExtras?.id,
          concepto_codigo: 'HORAS_EXT',
          concepto_nombre: 'Horas Extras',
          tipo: 'percepcion',
          categoria: 'salario',
          base_calculo: valorHora,
          cantidad: empleado.horas_extras,
          porcentaje: 135,
          monto: this.redondear(montoHorasExtras),
          es_fijo: false,
          es_gravable: true,
          orden: 2,
        });

        totalPercepciones += montoHorasExtras;
      }

      // 3. BONOS Y COMISIONES (si vienen en conceptos_adicionales)
      if (empleado.conceptos_adicionales) {
        let orden = 10;
        for (const concepto of empleado.conceptos_adicionales) {
          if (concepto.tipo === 'percepcion') {
            movimientos.push({
              concepto_id: concepto.concepto_id,
              concepto_codigo: concepto.codigo,
              concepto_nombre: concepto.nombre,
              tipo: 'percepcion',
              categoria: concepto.categoria || 'bono',
              base_calculo: concepto.base_calculo || null,
              monto: this.redondear(concepto.monto),
              es_manual: true,
              es_gravable: concepto.es_gravable !== false,
              orden: orden++,
            });

            totalPercepciones += concepto.monto;
          }
        }
      }

      // BASE GRAVABLE (solo percepciones gravables)
      const baseGravable = movimientos
        .filter((m) => m.tipo === 'percepcion' && m.es_gravable)
        .reduce((sum, m) => sum + m.monto, 0);

      // 4. DEDUCCIONES LEGALES - República Dominicana

      // AFP - 2.87% sobre base gravable
      const afp = baseGravable * 0.0287;
      const conceptoAFP = conceptosFijos.find((c) => c.codigo === 'AFP');
      movimientos.push({
        concepto_id: conceptoAFP?.id,
        concepto_codigo: 'AFP',
        concepto_nombre: 'AFP (2.87%)',
        tipo: 'deduccion',
        categoria: 'seguro_social',
        base_calculo: baseGravable,
        porcentaje: 2.87,
        monto: this.redondear(afp),
        es_fijo: true,
        es_gravable: false,
        formula_aplicada: 'base_gravable * 0.0287',
        orden: 100,
      });
      totalDeducciones += afp;

      // SFS - 3.04% sobre base gravable
      const sfs = baseGravable * 0.0304;
      const conceptoSFS = conceptosFijos.find((c) => c.codigo === 'SFS');
      movimientos.push({
        concepto_id: conceptoSFS?.id,
        concepto_codigo: 'SFS',
        concepto_nombre: 'Seguro Familiar de Salud (3.04%)',
        tipo: 'deduccion',
        categoria: 'seguro_social',
        base_calculo: baseGravable,
        porcentaje: 3.04,
        monto: this.redondear(sfs),
        es_fijo: true,
        es_gravable: false,
        formula_aplicada: 'base_gravable * 0.0304',
        orden: 101,
      });
      totalDeducciones += sfs;

      // ISR - Impuesto Sobre la Renta (escala progresiva RD 2024)
      const salarioMensual =
        (empleado.salario_base / diasPeriodo) *
        (diasPeriodo === 15 ? 30 : diasPeriodo * 2);
      const salarioAnual = salarioMensual * 12;
      const isr = this.calcularISR_RD(salarioAnual);
      const isrQuincenal = isr / 24;

      if (isrQuincenal > 0) {
        const conceptoISR = conceptosFijos.find((c) => c.codigo === 'ISR');
        movimientos.push({
          concepto_id: conceptoISR?.id,
          concepto_codigo: 'ISR',
          concepto_nombre: 'Impuesto Sobre la Renta',
          tipo: 'deduccion',
          categoria: 'isr',
          base_calculo: salarioAnual,
          monto: this.redondear(isrQuincenal),
          es_fijo: true,
          es_gravable: false,
          formula_aplicada: 'escala_progresiva_rd_2024',
          orden: 110,
        });
        totalDeducciones += isrQuincenal;
      }

      // 5. PRÉSTAMOS (si vienen)
      if (empleado.descuento_prestamo > 0) {
        const conceptoPrestamo = conceptosFijos.find(
          (c) => c.codigo === 'PRESTAMO',
        );
        movimientos.push({
          concepto_id: conceptoPrestamo?.id,
          concepto_codigo: 'PRESTAMO',
          concepto_nombre: 'Descuento Préstamo',
          tipo: 'deduccion',
          categoria: 'prestamo',
          monto: this.redondear(empleado.descuento_prestamo),
          es_manual: true,
          es_gravable: false,
          orden: 200,
        });
        totalDeducciones += empleado.descuento_prestamo;
      }

      // 6. OTRAS DEDUCCIONES (conceptos_adicionales)
      if (empleado.conceptos_adicionales) {
        let orden = 210;
        for (const concepto of empleado.conceptos_adicionales) {
          if (concepto.tipo === 'deduccion') {
            movimientos.push({
              concepto_id: concepto.concepto_id,
              concepto_codigo: concepto.codigo,
              concepto_nombre: concepto.nombre,
              tipo: 'deduccion',
              categoria: concepto.categoria || 'otros',
              monto: this.redondear(concepto.monto),
              es_manual: true,
              es_gravable: false,
              orden: orden++,
            });

            totalDeducciones += concepto.monto;
          }
        }
      }

      // SALARIO NETO
      const salarioNeto = totalPercepciones - totalDeducciones;

      // COSTOS PATRONALES (informativos)
      const afpPatronal = baseGravable * 0.071; // 7.10%
      const sfsPatronal = baseGravable * 0.0709; // 7.09%
      const srl = baseGravable * 0.012; // 1.2%
      const infotep = baseGravable * 0.01; // 1%
      const costoTotalEmpresa =
        totalPercepciones + afpPatronal + sfsPatronal + srl + infotep;

      return {
        dias_periodo: diasPeriodo,
        movimientos,
        total_percepciones: this.redondear(totalPercepciones),
        total_deducciones: this.redondear(totalDeducciones),
        salario_neto: this.redondear(salarioNeto),
        afp_patronal: this.redondear(afpPatronal),
        sfs_patronal: this.redondear(sfsPatronal),
        srl: this.redondear(srl),
        infotep: this.redondear(infotep),
        costo_total_empresa: this.redondear(costoTotalEmpresa),
      };
    } catch (error) {
      console.error('❌ Error calculando nómina de empleado:', error);
      throw error;
    }
  },

  /**
   * Calcular ISR según escala progresiva República Dominicana 2024
   */
  calcularISR_RD(salarioAnual) {
    let isr = 0;

    // Escala vigente RD 2024
    if (salarioAnual <= 416220.0) {
      isr = 0; // Exento
    } else if (salarioAnual <= 624329.0) {
      isr = (salarioAnual - 416220.0) * 0.15;
    } else if (salarioAnual <= 867123.0) {
      isr = 31216.0 + (salarioAnual - 624329.0) * 0.2;
    } else {
      isr = 79776.0 + (salarioAnual - 867123.0) * 0.25;
    }

    return isr;
  },

  /**
   * Calcular días de un período
   */
  calcularDiasPeriodo(tipoPeriodo) {
    switch (tipoPeriodo) {
      case 'semanal':
        return 7;
      case 'quincenal':
        return 15;
      case 'mensual':
        return 30;
      default:
        return 15;
    }
  },

  /**
   * Redondear a 2 decimales
   */
  redondear(valor) {
    return Math.round(valor * 100) / 100;
  },
};
