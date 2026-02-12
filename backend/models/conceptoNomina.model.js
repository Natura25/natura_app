// models/conceptoNomina.model.js
import { supabase } from '../config/supabase.js';

export default {
  async listarConceptos(filtros = {}) {
    try {
      let query = supabase
        .from('conceptos_nomina')
        .select('*', { count: 'exact' })
        .eq('eliminado', false)
        .order('orden_calculo', { ascending: true });

      if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
      if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
      if (filtros.activo !== undefined)
        query = query.eq('activo', filtros.activo);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('❌ Error listando conceptos:', error);
      throw error;
    }
  },

  async obtenerConceptoPorId(id) {
    try {
      const { data, error } = await supabase
        .from('conceptos_nomina')
        .select('*')
        .eq('id', id)
        .eq('eliminado', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo concepto:', error);
      throw error;
    }
  },

  async crearConcepto(datos, userId) {
    try {
      const { data, error } = await supabase
        .from('conceptos_nomina')
        .insert([
          {
            ...datos,
            activo: true,
            creado_por: userId,
            actualizado_por: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creando concepto:', error);
      throw error;
    }
  },

  async actualizarConcepto(id, datos, userId) {
    try {
      const { data, error } = await supabase
        .from('conceptos_nomina')
        .update({
          ...datos,
          actualizado_por: userId,
          actualizado_en: new Date(),
        })
        .eq('id', id)
        .eq('eliminado', false)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error actualizando concepto:', error);
      throw error;
    }
  },

  async eliminarConcepto(id, userId) {
    try {
      const { data, error } = await supabase
        .from('conceptos_nomina')
        .update({
          eliminado: true,
          eliminado_en: new Date(),
          eliminado_por: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error eliminando concepto:', error);
      throw error;
    }
  },

  async obtenerConceptosFijos() {
    try {
      const { data, error } = await supabase
        .from('conceptos_nomina')
        .select('*')
        .eq('eliminado', false)
        .eq('activo', true)
        .eq('es_fijo', true)
        .order('orden_calculo', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo conceptos fijos:', error);
      throw error;
    }
  },

  async obtenerPercepciones() {
    try {
      const { data, error } = await supabase
        .from('conceptos_nomina')
        .select('*')
        .eq('eliminado', false)
        .eq('activo', true)
        .eq('tipo', 'percepcion')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo percepciones:', error);
      throw error;
    }
  },

  async obtenerDeducciones() {
    try {
      const { data, error } = await supabase
        .from('conceptos_nomina')
        .select('*')
        .eq('eliminado', false)
        .eq('activo', true)
        .eq('tipo', 'deduccion')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo deducciones:', error);
      throw error;
    }
  },
};
