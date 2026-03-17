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
        departamento:categorias!empleados_departamento_id_fkey(id, codigo, nombre)
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

      if (filtros.departamento_id) {
        query = query.eq('departamento_id', filtros.departamento_id);
      }

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      if (filtros.tipo_contrato) {
        query = query.eq('tipo_contrato', filtros.tipo_contrato);
      }

      // Paginación
      const page = parseInt(filtros.page) || 1;
      const limit = parseInt(filtros.limit) || 50;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      // ✅ EJECUTAR QUERY PRIMERO
      const { data: empleados, error, count } = await query;
      if (error) throw error;

      // ✅ AHORA SÍ agregar supervisores
      const empleadosConSupervisor = await Promise.all(
        empleados.map(async (emp) => {
          if (emp.supervisor_id) {
            const { data: supervisor } = await supabase
              .from('empleados')
              .select('id, codigo, nombre_completo, puesto')
              .eq('id', emp.supervisor_id)
              .single();
            return { ...emp, supervisor };
          }
          return { ...emp, supervisor: null };
        }),
      );

      // ✅ RETORNAR UNA SOLA VEZ
      return { data: empleadosConSupervisor, count };
    } catch (error) {
      console.error('❌ Error listando empleados:', error);
      throw error;
    }
  },

  /**
   * Obtener empleado por ID completo
   */

  async obtenerEmpleadoPorId(id) {
    const { data: empleado, error } = await supabase
      .from('empleados')
      .select(
        `
        *,
        departamento:categorias(id, nombre),
        configuracion_salarial(*)
      `,
      )
      .eq('id', id)
      .eq('eliminado', false)
      .single();

    if (error) throw error;

    // Agregar supervisor si existe
    if (empleado.supervisor_id) {
      const { data: supervisor } = await supabase
        .from('empleados')
        .select('id, codigo, nombre_completo, puesto')
        .eq('id', empleado.supervisor_id)
        .single();
      empleado.supervisor = supervisor;
    }

    return empleado;
  },

  /**
   * Crear empleado
   */
  async crearEmpleado(datos, userId) {
    try {
      // Generar código automático si no viene
      if (!datos.codigo) {
        // Obtener el último código usado (solo no eliminados)
        const { data: ultimoEmpleado } = await supabase
          .from('empleados')
          .select('codigo')
          .eq('eliminado', false)
          .like('codigo', 'EMP-%')
          .order('codigo', { ascending: false })
          .limit(1);

        let siguienteNumero = 1;

        if (ultimoEmpleado && ultimoEmpleado.length > 0) {
          // Extraer el número del último código (ej: "EMP-0006" -> 6)
          const ultimoCodigo = ultimoEmpleado[0].codigo;
          const match = ultimoCodigo.match(/EMP-(\d+)/);
          if (match) {
            siguienteNumero = parseInt(match[1], 10) + 1;
          }
        }

        datos.codigo = `EMP-${String(siguienteNumero).padStart(4, '0')}`;

        // Verificar que el código generado no exista (doble seguridad)
        let codigoExiste = true;
        let intentos = 0;
        const maxIntentos = 10;

        while (codigoExiste && intentos < maxIntentos) {
          const { data: existe } = await supabase
            .from('empleados')
            .select('id')
            .eq('codigo', datos.codigo)
            .maybeSingle();

          if (existe) {
            // Si existe, incrementar y probar el siguiente
            siguienteNumero++;
            datos.codigo = `EMP-${String(siguienteNumero).padStart(4, '0')}`;
            intentos++;
          } else {
            codigoExiste = false;
          }
        }

        if (codigoExiste) {
          throw new Error(
            'No se pudo generar un código único después de múltiples intentos',
          );
        }

        console.log('📋 Código generado:', datos.codigo);
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

      if (error) {
        // Si aún así hay error de duplicado, hacer reintento automático
        if (error.code === '23505' && error.message.includes('codigo')) {
          console.log(
            '⚠️ Conflicto de código, reintentando con nuevo código...',
          );
          delete datos.codigo; // Eliminar el código conflictivo
          return this.crearEmpleado(datos, userId); // Reintentar
        }
        throw error;
      }

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
