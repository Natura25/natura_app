// backend/models/cuentasContables.model.js - VERSIÓN ACTUALIZADA CON SUPABASE

import { supabase } from '../config/supabase.js';

export default {
  // Crear una cuenta contable
  async crearCuentaContable(datos) {
    try {
      const { data, error } = await supabase
        .from('cuentas_contables')
        .insert([
          {
            codigo: datos.codigo,
            nombre: datos.nombre,
            tipo: datos.tipo,
            descripcion: datos.descripcion || null,
            padre_id: datos.padre_id || null,
            activo: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creando cuenta contable:', error);
      throw error;
    }
  },

  // Obtener todas las cuentas contables activas
  async obtenerCuentasContables(filtros = {}) {
    try {
      let query = supabase
        .from('cuentas_contables')
        .select('*', { count: 'exact' })
        .eq('activo', true)
        .order('codigo', { ascending: true });

      // Filtrar por tipo si viene en los filtros
      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      // Buscar por código o nombre
      if (filtros.busqueda) {
        query = query.or(
          `codigo.ilike.%${filtros.busqueda}%,nombre.ilike.%${filtros.busqueda}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data, count };
    } catch (error) {
      console.error('❌ Error obteniendo cuentas contables:', error);
      throw error;
    }
  },

  // Obtener cuenta contable por ID
  async obtenerCuentaContablePorId(id) {
    try {
      const { data, error } = await supabase
        .from('cuentas_contables')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo cuenta contable:', error);
      throw error;
    }
  },

  // Actualizar cuenta contable
  async actualizarCuentaContable(id, datos) {
    try {
      const updateData = {
        actualizado_en: new Date(),
      };

      // Solo actualizar campos que vengan en datos
      if (datos.codigo !== undefined) updateData.codigo = datos.codigo;
      if (datos.nombre !== undefined) updateData.nombre = datos.nombre;
      if (datos.tipo !== undefined) updateData.tipo = datos.tipo;
      if (datos.descripcion !== undefined)
        updateData.descripcion = datos.descripcion;
      if (datos.padre_id !== undefined) updateData.padre_id = datos.padre_id;

      const { data, error } = await supabase
        .from('cuentas_contables')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error actualizando cuenta contable:', error);
      throw error;
    }
  },

  // Desactivar cuenta contable (soft delete)
  async desactivarCuentaContable(id) {
    try {
      const { data, error } = await supabase
        .from('cuentas_contables')
        .update({
          activo: false,
          actualizado_en: new Date(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error desactivando cuenta contable:', error);
      throw error;
    }
  },

  // Activar cuenta contable
  async activarCuentaContable(id) {
    try {
      const { data, error } = await supabase
        .from('cuentas_contables')
        .update({
          activo: true,
          actualizado_en: new Date(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error activando cuenta contable:', error);
      throw error;
    }
  },

  // Obtener cuentas contables por tipo
  async obtenerCuentasContablesPorTipo(tipo) {
    try {
      const { data, error } = await supabase
        .from('cuentas_contables')
        .select('*')
        .eq('tipo', tipo)
        .eq('activo', true)
        .order('codigo', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo cuentas por tipo:', error);
      throw error;
    }
  },

  // Buscar cuenta contable por código
  async buscarCuentaContablePorCodigo(codigo) {
    try {
      const { data, error } = await supabase
        .from('cuentas_contables')
        .select('*')
        .eq('codigo', codigo)
        .eq('activo', true)
        .single();

      if (error) {
        // Si no encuentra, retornar null en lugar de lanzar error
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      console.error('❌ Error buscando cuenta por código:', error);
      throw error;
    }
  },
};
