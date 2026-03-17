// models/configuracionSalarial.model.js
// Modelo para gestionar configuraciones salariales de empleados
import { supabase } from '../config/supabase.js';

export default {
  /**
   * Obtener configuración salarial activa de un empleado
   */
  async obtenerConfiguracionActiva(empleadoId) {
    try {
      const { data, error } = await supabase
        .from('configuracion_salarial')
        .select('*')
        .eq('empleado_id', empleadoId)
        .eq('activo', true)
        .order('fecha_inicio', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo configuración activa:', error);
      throw error;
    }
  },

  /**
   * Obtener historial completo de salarios de un empleado
   */
  async obtenerHistorial(empleadoId) {
    try {
      const { data, error } = await supabase
        .from('configuracion_salarial')
        .select('*')
        .eq('empleado_id', empleadoId)
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      throw error;
    }
  },

  /**
   * Crear nueva configuración salarial
   */
  async crearConfiguracion(datos, userId) {
    try {
      // Desactivar configuraciones anteriores
      await supabase
        .from('configuracion_salarial')
        .update({
          activo: false,
          fecha_fin: new Date().toISOString().split('T')[0],
        })
        .eq('empleado_id', datos.empleado_id)
        .eq('activo', true);

      // Crear nueva configuración
      const { data, error } = await supabase
        .from('configuracion_salarial')
        .insert([
          {
            empleado_id: datos.empleado_id,
            salario_base: datos.salario_base,
            moneda: datos.moneda || 'DOP',
            periodo_pago: datos.periodo_pago,
            modalidad_pago: datos.modalidad_pago || 'transferencia',
            conceptos_fijos: datos.conceptos_fijos || [],
            fecha_inicio:
              datos.fecha_inicio || new Date().toISOString().split('T')[0],
            motivo_cambio: datos.motivo_cambio || null,
            activo: true,
            creado_por: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creando configuración:', error);
      throw error;
    }
  },

  /**
   * Actualizar configuración existente
   */
  async actualizarConfiguracion(id, datos, userId) {
    try {
      const { data, error } = await supabase
        .from('configuracion_salarial')
        .update({
          salario_base: datos.salario_base,
          periodo_pago: datos.periodo_pago,
          modalidad_pago: datos.modalidad_pago,
          conceptos_fijos: datos.conceptos_fijos,
          motivo_cambio: datos.motivo_cambio,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      throw error;
    }
  },

  /**
   * Desactivar configuración
   */
  async desactivarConfiguracion(id, fechaFin, userId) {
    try {
      const { data, error } = await supabase
        .from('configuracion_salarial')
        .update({
          activo: false,
          fecha_fin: fechaFin,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error desactivando configuración:', error);
      throw error;
    }
  },

  /**
   * Obtener empleados con salario en un rango
   */
  async obtenerPorRangoSalarial(minimo, maximo) {
    try {
      const { data, error } = await supabase
        .from('configuracion_salarial')
        .select(
          `
          *,
          empleado:empleados(id, codigo, nombre_completo, puesto)
        `,
        )
        .eq('activo', true)
        .gte('salario_base', minimo)
        .lte('salario_base', maximo)
        .order('salario_base', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo por rango:', error);
      throw error;
    }
  },

  /**
   * Calcular aumento masivo
   */
  async aplicarAumentoMasivo(porcentaje, empleadosIds, motivo, userId) {
    try {
      const resultados = [];

      for (const empleadoId of empleadosIds) {
        // Obtener configuración actual
        const configActual = await this.obtenerConfiguracionActiva(empleadoId);

        if (!configActual) continue;

        // Calcular nuevo salario
        const nuevoSalario = configActual.salario_base * (1 + porcentaje / 100);

        // Crear nueva configuración
        const nuevaConfig = await this.crearConfiguracion(
          {
            empleado_id: empleadoId,
            salario_base: nuevoSalario,
            periodo_pago: configActual.periodo_pago,
            modalidad_pago: configActual.modalidad_pago,
            conceptos_fijos: configActual.conceptos_fijos,
            motivo_cambio: motivo,
          },
          userId,
        );

        resultados.push({
          empleado_id: empleadoId,
          salario_anterior: configActual.salario_base,
          salario_nuevo: nuevoSalario,
          aumento: nuevoSalario - configActual.salario_base,
        });
      }

      return resultados;
    } catch (error) {
      console.error('❌ Error aplicando aumento masivo:', error);
      throw error;
    }
  },
};
