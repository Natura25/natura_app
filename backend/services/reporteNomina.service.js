// services/reporteNomina.service.js
// Servicio para generar reportes de nómina en diferentes formatos
import { supabase } from '../config/supabase.js';

export default {
  /**
   * Generar reporte de nómina (datos estructurados para PDF/Excel)
   */
  async generarReporteNomina(nominaId) {
    try {
      // Obtener nómina con detalle
      const { data: nomina, error } = await supabase
        .from('nominas')
        .select(
          `
          *,
          departamento:categorias(nombre),
          detalle:detalle_nomina(
            *,
            empleado:empleados(codigo, nombre_completo, cedula, puesto)
          )
        `,
        )
        .eq('id', nominaId)
        .single();

      if (error) throw error;

      // Calcular totales
      const totales = {
        total_empleados: nomina.detalle.length,
        total_salario_base: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.salario_base),
          0,
        ),
        total_percepciones: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.total_percepciones),
          0,
        ),
        total_deducciones: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.total_deducciones),
          0,
        ),
        total_neto: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.salario_neto),
          0,
        ),
        total_afp_patronal: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.afp_patronal || 0),
          0,
        ),
        total_sfs_patronal: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.sfs_patronal || 0),
          0,
        ),
        total_srl: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.srl || 0),
          0,
        ),
        total_infotep: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.infotep || 0),
          0,
        ),
        total_costo_empresa: nomina.detalle.reduce(
          (sum, d) => sum + Number(d.costo_total_empresa || 0),
          0,
        ),
      };

      return {
        nomina: {
          codigo: nomina.codigo,
          periodo_inicio: nomina.periodo_inicio,
          periodo_fin: nomina.periodo_fin,
          tipo_periodo: nomina.tipo_periodo,
          descripcion: nomina.descripcion,
          estado: nomina.estado,
          fecha_calculo: nomina.fecha_calculo,
          departamento: nomina.departamento?.nombre || 'Todos',
        },
        totales,
        detalle: nomina.detalle.map((d) => ({
          codigo: d.empleado?.codigo,
          nombre: d.empleado?.nombre_completo,
          cedula: d.empleado?.cedula,
          puesto: d.empleado?.puesto,
          salario_base: Number(d.salario_base),
          dias_trabajados: d.dias_trabajados,
          dias_ausencias: d.dias_ausencias,
          total_percepciones: Number(d.total_percepciones),
          total_deducciones: Number(d.total_deducciones),
          salario_neto: Number(d.salario_neto),
          estado: d.estado,
        })),
      };
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      throw error;
    }
  },

  /**
   * Generar recibo de pago individual
   */
  async generarReciboIndividual(detalleNominaId) {
    try {
      const { data: detalle, error } = await supabase
        .from('detalle_nomina')
        .select(
          `
          *,
          nomina:nominas(codigo, periodo_inicio, periodo_fin, tipo_periodo),
          empleado:empleados(codigo, nombre_completo, cedula, puesto, departamento:categorias(nombre)),
          movimientos:movimientos_nomina(*)
        `,
        )
        .eq('id', detalleNominaId)
        .single();

      if (error) throw error;

      // Separar percepciones y deducciones
      const percepciones = detalle.movimientos.filter(
        (m) => m.tipo === 'percepcion',
      );
      const deducciones = detalle.movimientos.filter(
        (m) => m.tipo === 'deduccion',
      );

      return {
        nomina: {
          codigo: detalle.nomina.codigo,
          periodo_inicio: detalle.nomina.periodo_inicio,
          periodo_fin: detalle.nomina.periodo_fin,
          tipo_periodo: detalle.nomina.tipo_periodo,
        },
        empleado: {
          codigo: detalle.empleado.codigo,
          nombre: detalle.empleado.nombre_completo,
          cedula: detalle.empleado.cedula,
          puesto: detalle.empleado.puesto,
          departamento: detalle.empleado.departamento?.nombre,
        },
        detalle: {
          salario_base: Number(detalle.salario_base),
          dias_periodo: detalle.dias_periodo,
          dias_trabajados: detalle.dias_trabajados,
          dias_ausencias: detalle.dias_ausencias,
          horas_extras: Number(detalle.horas_extras || 0),
        },
        percepciones: percepciones.map((p) => ({
          concepto: p.concepto_nombre,
          monto: Number(p.monto),
        })),
        deducciones: deducciones.map((d) => ({
          concepto: d.concepto_nombre,
          monto: Number(d.monto),
        })),
        totales: {
          total_percepciones: Number(detalle.total_percepciones),
          total_deducciones: Number(detalle.total_deducciones),
          salario_neto: Number(detalle.salario_neto),
        },
        costos_patronales: {
          afp: Number(detalle.afp_patronal || 0),
          sfs: Number(detalle.sfs_patronal || 0),
          srl: Number(detalle.srl || 0),
          infotep: Number(detalle.infotep || 0),
          total: Number(detalle.costo_total_empresa || 0),
        },
      };
    } catch (error) {
      console.error('❌ Error generando recibo:', error);
      throw error;
    }
  },

  /**
   * Reporte de costos mensuales
   */
  async generarReporteCostos(anio, mes) {
    try {
      const { data: nominas, error } = await supabase
        .from('nominas')
        .select(
          `
          id,
          codigo,
          periodo_inicio,
          periodo_fin,
          total_neto,
          total_afp_patronal,
          total_sfs_patronal,
          total_srl,
          total_infotep,
          total_costo_empresa
        `,
        )
        .eq('anio', anio)
        .eq('mes', mes)
        .eq('eliminado', false)
        .in('estado', ['aprobado', 'pagado'])
        .order('periodo_inicio');

      if (error) throw error;

      const totales = {
        total_neto: nominas.reduce(
          (sum, n) => sum + Number(n.total_neto || 0),
          0,
        ),
        total_afp_patronal: nominas.reduce(
          (sum, n) => sum + Number(n.total_afp_patronal || 0),
          0,
        ),
        total_sfs_patronal: nominas.reduce(
          (sum, n) => sum + Number(n.total_sfs_patronal || 0),
          0,
        ),
        total_srl: nominas.reduce(
          (sum, n) => sum + Number(n.total_srl || 0),
          0,
        ),
        total_infotep: nominas.reduce(
          (sum, n) => sum + Number(n.total_infotep || 0),
          0,
        ),
        total_costo_empresa: nominas.reduce(
          (sum, n) => sum + Number(n.total_costo_empresa || 0),
          0,
        ),
      };

      return {
        anio,
        mes,
        nominas: nominas.length,
        detalle: nominas,
        totales,
      };
    } catch (error) {
      console.error('❌ Error generando reporte de costos:', error);
      throw error;
    }
  },

  /**
   * Reporte de deducciones por concepto
   */
  async generarReporteDeducciones(nominaId) {
    try {
      const { data: movimientos, error } = await supabase
        .from('movimientos_nomina')
        .select(
          `
          concepto_codigo,
          concepto_nombre,
          monto,
          detalle:detalle_nomina!inner(nomina_id)
        `,
        )
        .eq('detalle.nomina_id', nominaId)
        .eq('tipo', 'deduccion');

      if (error) throw error;

      // Agrupar por concepto
      const agrupado = {};
      movimientos.forEach((m) => {
        if (!agrupado[m.concepto_codigo]) {
          agrupado[m.concepto_codigo] = {
            codigo: m.concepto_codigo,
            nombre: m.concepto_nombre,
            total: 0,
            cantidad: 0,
          };
        }
        agrupado[m.concepto_codigo].total += Number(m.monto);
        agrupado[m.concepto_codigo].cantidad += 1;
      });

      return Object.values(agrupado);
    } catch (error) {
      console.error('❌ Error generando reporte de deducciones:', error);
      throw error;
    }
  },

  /**
   * Reporte comparativo de nóminas
   */
  async generarReporteComparativo(anio) {
    try {
      const { data: nominas, error } = await supabase
        .from('nominas')
        .select('mes, total_neto, total_costo_empresa, total_empleados')
        .eq('anio', anio)
        .eq('eliminado', false)
        .in('estado', ['aprobado', 'pagado'])
        .order('mes');

      if (error) throw error;

      // Agrupar por mes
      const porMes = Array(12)
        .fill(null)
        .map((_, i) => ({
          mes: i + 1,
          nombre_mes: new Date(anio, i).toLocaleString('es', { month: 'long' }),
          total_neto: 0,
          total_costo: 0,
          empleados: 0,
          nominas: 0,
        }));

      nominas.forEach((n) => {
        const mesIndex = n.mes - 1;
        porMes[mesIndex].total_neto += Number(n.total_neto || 0);
        porMes[mesIndex].total_costo += Number(n.total_costo_empresa || 0);
        porMes[mesIndex].empleados = Math.max(
          porMes[mesIndex].empleados,
          n.total_empleados || 0,
        );
        porMes[mesIndex].nominas += 1;
      });

      return {
        anio,
        por_mes: porMes,
        totales: {
          total_neto: porMes.reduce((sum, m) => sum + m.total_neto, 0),
          total_costo: porMes.reduce((sum, m) => sum + m.total_costo, 0),
          promedio_mensual:
            porMes.reduce((sum, m) => sum + m.total_neto, 0) / 12,
        },
      };
    } catch (error) {
      console.error('❌ Error generando reporte comparativo:', error);
      throw error;
    }
  },

  /**
   * Datos para archivo bancario
   */
  async generarArchivoBancario(nominaId) {
    try {
      const { data: detalles, error } = await supabase
        .from('detalle_nomina')
        .select(
          `
          salario_neto,
          metodo_pago,
          banco,
          numero_cuenta,
          empleado:empleados(codigo, nombre_completo, cedula)
        `,
        )
        .eq('nomina_id', nominaId)
        .eq('estado', 'aprobado')
        .eq('metodo_pago', 'transferencia');

      if (error) throw error;

      return detalles.map((d) => ({
        codigo_empleado: d.empleado.codigo,
        nombre: d.empleado.nombre_completo,
        cedula: d.empleado.cedula,
        banco: d.banco,
        cuenta: d.numero_cuenta,
        monto: Number(d.salario_neto).toFixed(2),
      }));
    } catch (error) {
      console.error('❌ Error generando archivo bancario:', error);
      throw error;
    }
  },
};
