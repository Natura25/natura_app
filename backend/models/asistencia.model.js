// models/asistencia.model.js
// Modelo para gestionar asistencias y control de horarios
import { supabase } from '../config/supabase.js';

export default {
  /**
   * Listar asistencias con filtros
   */
  async listarAsistencias(filtros = {}) {
    try {
      let query = supabase
        .from('asistencias')
        .select(
          `
          *,
          empleado:empleados(id, codigo, nombre_completo, puesto)
        `,
          { count: 'exact' },
        )
        .order('fecha', { ascending: false });

      // Filtros
      if (filtros.empleado_id)
        query = query.eq('empleado_id', filtros.empleado_id);
      if (filtros.fecha_desde) query = query.gte('fecha', filtros.fecha_desde);
      if (filtros.fecha_hasta) query = query.lte('fecha', filtros.fecha_hasta);
      if (filtros.estado) query = query.eq('estado', filtros.estado);
      if (filtros.turno) query = query.eq('turno', filtros.turno);

      // Paginación
      const page = parseInt(filtros.page) || 1;
      const limit = parseInt(filtros.limit) || 50;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data, count };
    } catch (error) {
      console.error('❌ Error listando asistencias:', error);
      throw error;
    }
  },

  /**
   * Registrar entrada/salida
   */
  async registrarAsistencia(datos, userId) {
    try {
      const fecha = datos.fecha || new Date().toISOString().split('T')[0];

      // Verificar si ya existe registro para hoy
      const { data: existe } = await supabase
        .from('asistencias')
        .select('id, hora_entrada_real, hora_salida_real')
        .eq('empleado_id', datos.empleado_id)
        .eq('fecha', fecha)
        .single();

      if (existe) {
        // Ya existe, registrar salida
        return await this.registrarSalida(existe.id, datos, userId);
      } else {
        // No existe, registrar entrada
        return await this.registrarEntrada(datos, userId);
      }
    } catch (error) {
      console.error('❌ Error registrando asistencia:', error);
      throw error;
    }
  },

  /**
   * Registrar entrada
   */
  async registrarEntrada(datos, userId) {
    try {
      const horaEntrada =
        datos.hora_entrada || new Date().toTimeString().split(' ')[0];
      const fecha = datos.fecha || new Date().toISOString().split('T')[0];

      // Calcular tardanza si hay hora programada
      let minutosTardanza = 0;
      if (
        datos.hora_entrada_programada &&
        horaEntrada > datos.hora_entrada_programada
      ) {
        const [h1, m1] = datos.hora_entrada_programada.split(':');
        const [h2, m2] = horaEntrada.split(':');
        const minutosProgramados = parseInt(h1) * 60 + parseInt(m1);
        const minutosReales = parseInt(h2) * 60 + parseInt(m2);
        minutosTardanza = minutosReales - minutosProgramados;
      }

      const { data, error } = await supabase
        .from('asistencias')
        .insert([
          {
            empleado_id: datos.empleado_id,
            fecha: fecha,
            turno: datos.turno || 'dia',
            hora_entrada_programada: datos.hora_entrada_programada,
            hora_salida_programada: datos.hora_salida_programada,
            hora_entrada_real: horaEntrada,
            minutos_tardanza: minutosTardanza,
            estado: minutosTardanza > 0 ? 'tardanza' : 'presente',
            latitud_entrada: datos.latitud,
            longitud_entrada: datos.longitud,
            dispositivo_entrada: datos.dispositivo,
            observaciones: datos.observaciones,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Entrada registrada');
      return data;
    } catch (error) {
      console.error('❌ Error registrando entrada:', error);
      throw error;
    }
  },

  /**
   * Registrar salida
   */
  async registrarSalida(asistenciaId, datos, userId) {
    try {
      const horaSalida =
        datos.hora_salida || new Date().toTimeString().split(' ')[0];

      // Obtener asistencia
      const { data: asistencia } = await supabase
        .from('asistencias')
        .select('*')
        .eq('id', asistenciaId)
        .single();

      if (!asistencia) throw new Error('Asistencia no encontrada');

      // Calcular horas trabajadas
      const [h1, m1, s1] = asistencia.hora_entrada_real.split(':');
      const [h2, m2, s2] = horaSalida.split(':');
      const minutosEntrada = parseInt(h1) * 60 + parseInt(m1);
      const minutosSalida = parseInt(h2) * 60 + parseInt(m2);
      const horasTrabajadas = (minutosSalida - minutosEntrada) / 60;

      // Calcular horas extras (si trabajó más de 8 horas)
      let horasExtras = 0;
      if (horasTrabajadas > 8) {
        horasExtras = horasTrabajadas - 8;
      }

      // Calcular horas nocturnas (si trabajó entre 8pm y 6am)
      let horasNocturnas = 0;
      const horaSalidaNum = parseInt(h2);
      if (horaSalidaNum >= 20 || horaSalidaNum < 6) {
        horasNocturnas = 1; // Simplificado, calcular exacto si es necesario
      }

      const { data, error } = await supabase
        .from('asistencias')
        .update({
          hora_salida_real: horaSalida,
          horas_trabajadas: horasTrabajadas.toFixed(2),
          horas_extras: horasExtras.toFixed(2),
          horas_nocturnas: horasNocturnas.toFixed(2),
          latitud_salida: datos.latitud,
          longitud_salida: datos.longitud,
          dispositivo_salida: datos.dispositivo,
        })
        .eq('id', asistenciaId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Salida registrada');
      return data;
    } catch (error) {
      console.error('❌ Error registrando salida:', error);
      throw error;
    }
  },

  /**
   * Marcar ausencia/falta
   */
  async marcarAusencia(empleadoId, fecha, motivo, userId) {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .insert([
          {
            empleado_id: empleadoId,
            fecha: fecha,
            estado: 'falta',
            observaciones: motivo,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error marcando ausencia:', error);
      throw error;
    }
  },

  /**
   * Justificar ausencia
   */
  async justificarAusencia(asistenciaId, motivo, ausenciaId, userId) {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .update({
          justificado: true,
          ausencia_id: ausenciaId,
          motivo_justificacion: motivo,
          estado: 'justificado',
        })
        .eq('id', asistenciaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error justificando ausencia:', error);
      throw error;
    }
  },

  /**
   * Obtener resumen de asistencias de un empleado
   */
  async obtenerResumen(empleadoId, fechaInicio, fechaFin) {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select('*')
        .eq('empleado_id', empleadoId)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

      if (error) throw error;

      // Calcular totales
      const resumen = {
        total_dias: data.length,
        presentes: data.filter((a) => a.estado === 'presente').length,
        tardanzas: data.filter((a) => a.estado === 'tardanza').length,
        faltas: data.filter((a) => a.estado === 'falta').length,
        justificadas: data.filter((a) => a.justificado).length,
        total_horas_trabajadas: data.reduce(
          (sum, a) => sum + (parseFloat(a.horas_trabajadas) || 0),
          0,
        ),
        total_horas_extras: data.reduce(
          (sum, a) => sum + (parseFloat(a.horas_extras) || 0),
          0,
        ),
        total_minutos_tardanza: data.reduce(
          (sum, a) => sum + (a.minutos_tardanza || 0),
          0,
        ),
      };

      return resumen;
    } catch (error) {
      console.error('❌ Error obteniendo resumen:', error);
      throw error;
    }
  },

  /**
   * Obtener horas extras del período para nómina
   */
  async obtenerHorasExtrasParaNomina(empleadoId, fechaInicio, fechaFin) {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select('horas_extras')
        .eq('empleado_id', empleadoId)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

      if (error) throw error;

      const totalHorasExtras = data.reduce(
        (sum, a) => sum + (parseFloat(a.horas_extras) || 0),
        0,
      );
      return totalHorasExtras;
    } catch (error) {
      console.error('❌ Error obteniendo horas extras:', error);
      throw error;
    }
  },

  /**
   * Reporte de asistencias por departamento
   */
  async reportePorDepartamento(departamentoId, fechaInicio, fechaFin) {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select(
          `
          *,
          empleado:empleados!inner(id, nombre_completo, puesto, departamento_id)
        `,
        )
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .eq('empleado.departamento_id', departamentoId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error en reporte:', error);
      throw error;
    }
  },
};
