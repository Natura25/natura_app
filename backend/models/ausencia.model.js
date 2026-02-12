// models/ausencia.model.js
import { supabase } from '../config/supabase.js';

export default {
  async listarAusencias(filtros = {}) {
    try {
      let query = supabase
        .from('ausencias_empleados')
        .select(
          `
          *,
          empleado:empleados(id, codigo, nombre_completo, puesto)
        `,
          { count: 'exact' },
        )
        .eq('eliminado', false)
        .order('fecha_inicio', { ascending: false });

      if (filtros.empleado_id)
        query = query.eq('empleado_id', filtros.empleado_id);
      if (filtros.estado) query = query.eq('estado', filtros.estado);
      if (filtros.tipo) query = query.eq('tipo', filtros.tipo);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('❌ Error listando ausencias:', error);
      throw error;
    }
  },

  async crearAusencia(datos, userId) {
    try {
      const { count } = await supabase
        .from('ausencias_empleados')
        .select('*', { count: 'exact', head: true });
      const codigo = `AUS-${String(count + 1).padStart(4, '0')}`;

      // Calcular días de ausencia
      const fechaInicio = new Date(datos.fecha_inicio);
      const fechaFin = new Date(datos.fecha_fin);
      const diasAusencia =
        Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;

      const { data, error } = await supabase
        .from('ausencias_empleados')
        .insert([
          {
            codigo,
            empleado_id: datos.empleado_id,
            tipo: datos.tipo,
            fecha_inicio: datos.fecha_inicio,
            fecha_fin: datos.fecha_fin,
            dias_ausencia: diasAusencia,
            afecta_nomina: datos.afecta_nomina !== false,
            es_justificada: datos.es_justificada || false,
            motivo: datos.motivo || null,
            estado: 'pendiente',
            creado_por: userId,
            actualizado_por: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creando ausencia:', error);
      throw error;
    }
  },

  async aprobarAusencia(id, userId) {
    try {
      const { data, error } = await supabase
        .from('ausencias_empleados')
        .update({
          estado: 'aprobada',
          aprobado_por: userId,
          fecha_aprobacion: new Date().toISOString(),
          actualizado_por: userId,
        })
        .eq('id', id)
        .eq('estado', 'pendiente')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error aprobando ausencia:', error);
      throw error;
    }
  },

  async rechazarAusencia(id, motivo, userId) {
    try {
      const { data, error } = await supabase
        .from('ausencias_empleados')
        .update({
          estado: 'rechazada',
          aprobado_por: userId,
          fecha_aprobacion: new Date().toISOString(),
          motivo_rechazo: motivo,
          actualizado_por: userId,
        })
        .eq('id', id)
        .eq('estado', 'pendiente')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error rechazando ausencia:', error);
      throw error;
    }
  },
};
