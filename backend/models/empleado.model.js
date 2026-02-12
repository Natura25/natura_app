// models/empleado.model.js
// Modelo para gestión de empleados con soporte completo para nómina
import { supabase } from '../config/supabase.js';

export default {
  /**
   * Listar empleados con filtros y paginación
   */
  async listarEmpleados(filtros = {}) {
    try {
      let query = supabase
        .from('empleados')
        .select(
          `
          *,
          departamento:categorias!empleados_departamento_id_fkey(id, codigo, nombre),
          supervisor:empleados!empleados_supervisor_id_fkey(id, codigo, nombre_completo),
          user:perfiles_usuario!empleados_user_id_fkey(user_id, username, email)
        `,
          { count: 'exact' },
        )
        .eq('eliminado', false)
        .order('apellidos', { ascending: true });

      // Aplicar filtros
      if (filtros.busqueda) {
        query = query.or(
          `nombre_completo.ilike.%${filtros.busqueda}%,cedula.ilike.%${filtros.busqueda}%,codigo.ilike.%${filtros.busqueda}%`,
        );
      }

      if (filtros.departamento_id)
        query = query.eq('departamento_id', filtros.departamento_id);
      if (filtros.estado) query = query.eq('estado', filtros.estado);
      if (filtros.tipo_contrato)
        query = query.eq('tipo_contrato', filtros.tipo_contrato);

      // Paginación
      const page = parseInt(filtros.page) || 1;
      const limit = parseInt(filtros.limit) || 50;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data, count };
    } catch (error) {
      console.error('❌ Error listando empleados:', error);
      throw error;
    }
  },

  /**
   * Obtener empleado por ID completo
   */
  async obtenerEmpleadoPorId(id) {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select(
          `
          *,
          departamento:categorias!empleados_departamento_id_fkey(id, codigo, nombre),
          supervisor:empleados!empleados_supervisor_id_fkey(id, codigo, nombre_completo),
          configuracion_salarial(id, salario_base, periodo_pago, fecha_inicio, fecha_fin, activo)
        `,
        )
        .eq('id', id)
        .eq('eliminado', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo empleado:', error);
      throw error;
    }
  },

  /**
   * Crear empleado
   */
  async crearEmpleado(datos, userId) {
    try {
      // Generar código automático
      if (!datos.codigo) {
        const { count } = await supabase
          .from('empleados')
          .select('*', { count: 'exact', head: true })
          .eq('eliminado', false);
        datos.codigo = `EMP-${String(count + 1).padStart(4, '0')}`;
      }

      const { data, error } = await supabase
        .from('empleados')
        .insert([
          {
            ...datos,
            estado: 'activo',
            creado_por: userId,
            actualizado_por: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error creando empleado:', error);
      throw error;
    }
  },

  /**
   * Actualizar empleado
   */
  async actualizarEmpleado(id, datos, userId) {
    try {
      const { data, error } = await supabase
        .from('empleados')
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
      console.error('❌ Error actualizando empleado:', error);
      throw error;
    }
  },

  /**
   * Eliminar empleado (soft delete)
   */
  async eliminarEmpleado(id, userId) {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .update({
          eliminado: true,
          eliminado_en: new Date(),
          eliminado_por: userId,
          estado: 'inactivo',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error eliminando empleado:', error);
      throw error;
    }
  },

  /**
   * Obtener empleados activos para nómina
   */
  async obtenerEmpleadosParaNomina(departamento_id = null) {
    try {
      let query = supabase
        .from('empleados')
        .select(
          `
          *,
          configuracion_salarial!inner(id, salario_base, periodo_pago, activo)
        `,
        )
        .eq('eliminado', false)
        .eq('estado', 'activo')
        .eq('configuracion_salarial.activo', true);

      if (departamento_id) {
        query = query.eq('departamento_id', departamento_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo empleados para nómina:', error);
      throw error;
    }
  },

  /**
   * Configurar salario
   */
  async configurarSalario(empleadoId, datos, userId) {
    try {
      // Desactivar configuraciones anteriores
      await supabase
        .from('configuracion_salarial')
        .update({ activo: false })
        .eq('empleado_id', empleadoId)
        .eq('activo', true);

      // Crear nueva
      const { data, error } = await supabase
        .from('configuracion_salarial')
        .insert([
          {
            empleado_id: empleadoId,
            salario_base: datos.salario_base,
            periodo_pago: datos.periodo_pago || 'quincenal',
            fecha_inicio:
              datos.fecha_inicio || new Date().toISOString().split('T')[0],
            activo: true,
            creado_por: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error configurando salario:', error);
      throw error;
    }
  },
};
