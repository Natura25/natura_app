// models/cliente.model.js - CON SUPABASE
import { supabase } from '../config/supabaseClient.js';

class Cliente {
  // ============= OBTENER TODOS =============
  static async obtenerTodos(filtros = {}) {
    try {
      console.log('📋 Obteniendo clientes desde Supabase...');

      let query = supabase
        .from('clientes')
        .select(
          `
          *,
          ventas:ventas(count),
          cuentas:cuentas_por_cobrar(monto_pendiente)
        `
        )
        .eq('activo', true);

      // Aplicar filtros
      if (filtros.tipo_cliente) {
        query = query.eq('tipo_cliente', filtros.tipo_cliente);
      }

      if (filtros.ciudad) {
        query = query.eq('ciudad', filtros.ciudad);
      }

      if (filtros.provincia) {
        query = query.eq('provincia', filtros.provincia);
      }

      query = query.order('nombre', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error Supabase:', error);
        throw error;
      }

      // Calcular campos adicionales
      const clientesConCalculos = data.map((cliente) => ({
        ...cliente,
        total_ventas: cliente.ventas?.[0]?.count || 0,
        saldo_pendiente:
          cliente.cuentas?.reduce(
            (sum, c) => sum + (parseFloat(c.monto_pendiente) || 0),
            0
          ) || 0,
      }));

      console.log(`✅ ${clientesConCalculos.length} clientes obtenidos`);
      return clientesConCalculos;
    } catch (error) {
      console.error('❌ Error en Cliente.obtenerTodos:', error);
      throw error;
    }
  }

  // ============= OBTENER POR ID =============
  static async obtenerPorId(id) {
    try {
      console.log(`🔍 Obteniendo cliente ID: ${id}`);

      const { data, error } = await supabase
        .from('clientes')
        .select(
          `
          *,
          ventas:ventas(id, monto, fecha_venta, estado),
          cuentas:cuentas_por_cobrar(
            id, 
            monto_pendiente, 
            fecha_vencimiento, 
            estado
          )
        `
        )
        .eq('id', id)
        .eq('activo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        console.error('❌ Error Supabase:', error);
        throw error;
      }

      // Calcular totales
      const ventasActivas =
        data.ventas?.filter((v) => v.estado === 'activa') || [];
      const cuentasPendientes =
        data.cuentas?.filter((c) => c.estado === 'pendiente') || [];

      const clienteConCalculos = {
        ...data,
        total_ventas: ventasActivas.length,
        monto_total_ventas: ventasActivas.reduce(
          (sum, v) => sum + (parseFloat(v.monto) || 0),
          0
        ),
        saldo_pendiente: cuentasPendientes.reduce(
          (sum, c) => sum + (parseFloat(c.monto_pendiente) || 0),
          0
        ),
        credito_disponible:
          (parseFloat(data.limite_credito) || 0) -
          cuentasPendientes.reduce(
            (sum, c) => sum + (parseFloat(c.monto_pendiente) || 0),
            0
          ),
      };

      console.log(`✅ Cliente encontrado: ${data.nombre}`);
      return clienteConCalculos;
    } catch (error) {
      console.error('❌ Error en Cliente.obtenerPorId:', error);
      throw error;
    }
  }

  // ============= BUSCAR =============
  static async buscar(criterios) {
    try {
      console.log('🔎 Buscando clientes...', criterios);

      let query = supabase
        .from('clientes')
        .select(
          `
          *,
          cuentas:cuentas_por_cobrar(monto_pendiente)
        `
        )
        .eq('activo', true);

      // Aplicar criterios de búsqueda
      if (criterios.cedula) {
        query = query.ilike('cedula', `%${criterios.cedula}%`);
      }

      if (criterios.rnc) {
        query = query.ilike('rnc', `%${criterios.rnc}%`);
      }

      if (criterios.nombre) {
        query = query.or(
          `nombre.ilike.%${criterios.nombre}%,nombre_comercial.ilike.%${criterios.nombre}%`
        );
      }

      if (criterios.telefono) {
        query = query.ilike('telefono', `%${criterios.telefono}%`);
      }

      if (criterios.email) {
        query = query.ilike('email', `%${criterios.email}%`);
      }

      if (criterios.tipo_cliente) {
        query = query.eq('tipo_cliente', criterios.tipo_cliente);
      }

      if (criterios.ciudad) {
        query = query.eq('ciudad', criterios.ciudad);
      }

      query = query.order('nombre', { ascending: true }).limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error Supabase:', error);
        throw error;
      }

      // Calcular saldo pendiente
      const clientesConCalculos = data.map((cliente) => ({
        ...cliente,
        saldo_pendiente:
          cliente.cuentas?.reduce(
            (sum, c) => sum + (parseFloat(c.monto_pendiente) || 0),
            0
          ) || 0,
      }));

      console.log(`✅ ${clientesConCalculos.length} clientes encontrados`);
      return clientesConCalculos;
    } catch (error) {
      console.error('❌ Error en Cliente.buscar:', error);
      throw error;
    }
  }

  // ============= CREAR =============
  static async crear(clienteData) {
    try {
      console.log('➕ Creando cliente:', clienteData.nombre);

      // Verificar duplicados
      if (clienteData.cedula) {
        const { data: existente } = await supabase
          .from('clientes')
          .select('id')
          .eq('cedula', clienteData.cedula)
          .eq('activo', true)
          .single();

        if (existente) {
          throw new Error('Ya existe un cliente con esa cédula');
        }
      }

      if (clienteData.rnc) {
        const { data: existente } = await supabase
          .from('clientes')
          .select('id')
          .eq('rnc', clienteData.rnc)
          .eq('activo', true)
          .single();

        if (existente) {
          throw new Error('Ya existe un cliente con ese RNC');
        }
      }

      if (clienteData.email) {
        const { data: existente } = await supabase
          .from('clientes')
          .select('id')
          .eq('email', clienteData.email)
          .eq('activo', true)
          .single();

        if (existente) {
          throw new Error('Ya existe un cliente con ese email');
        }
      }

      // Crear cliente
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          cedula: clienteData.cedula || null,
          rnc: clienteData.rnc || null,
          nombre: clienteData.nombre,
          nombre_comercial: clienteData.nombre_comercial || null,
          es_empresa: clienteData.es_empresa || false,
          tipo_cliente: clienteData.tipo_cliente || 'minorista',
          email: clienteData.email || null,
          telefono: clienteData.telefono || null,
          telefono_emergencia: clienteData.telefono_emergencia || null,
          contacto_emergencia: clienteData.contacto_emergencia || null,
          direccion: clienteData.direccion || null,
          sector: clienteData.sector || null,
          ciudad: clienteData.ciudad || null,
          provincia: clienteData.provincia || null,
          codigo_postal: clienteData.codigo_postal || null,
          fecha_nacimiento: clienteData.fecha_nacimiento || null,
          limite_credito: clienteData.limite_credito || 0,
          descuento_aplicable: clienteData.descuento_aplicable || 0,
          notas: clienteData.notas || null,
          activo: true,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error Supabase:', error);
        throw error;
      }

      console.log(`✅ Cliente creado con ID: ${data.id}`);
      return data;
    } catch (error) {
      console.error('❌ Error en Cliente.crear:', error);
      throw error;
    }
  }

  // ============= ACTUALIZAR =============
  static async actualizar(id, clienteData) {
    try {
      console.log(`✏️ Actualizando cliente ID: ${id}`);

      // Verificar que existe
      const clienteExiste = await this.obtenerPorId(id);
      if (!clienteExiste) {
        throw new Error('Cliente no encontrado');
      }

      // Verificar duplicados (excluyendo el actual)
      if (clienteData.cedula && clienteData.cedula !== clienteExiste.cedula) {
        const { data: existente } = await supabase
          .from('clientes')
          .select('id')
          .eq('cedula', clienteData.cedula)
          .neq('id', id)
          .eq('activo', true)
          .single();

        if (existente) {
          throw new Error('Ya existe otro cliente con esa cédula');
        }
      }

      if (clienteData.email && clienteData.email !== clienteExiste.email) {
        const { data: existente } = await supabase
          .from('clientes')
          .select('id')
          .eq('email', clienteData.email)
          .neq('id', id)
          .eq('activo', true)
          .single();

        if (existente) {
          throw new Error('Ya existe otro cliente con ese email');
        }
      }

      // Actualizar
      const { data, error } = await supabase
        .from('clientes')
        .update({
          cedula: clienteData.cedula,
          rnc: clienteData.rnc,
          nombre: clienteData.nombre,
          nombre_comercial: clienteData.nombre_comercial,
          es_empresa: clienteData.es_empresa,
          tipo_cliente: clienteData.tipo_cliente,
          email: clienteData.email,
          telefono: clienteData.telefono,
          telefono_emergencia: clienteData.telefono_emergencia,
          contacto_emergencia: clienteData.contacto_emergencia,
          direccion: clienteData.direccion,
          sector: clienteData.sector,
          ciudad: clienteData.ciudad,
          provincia: clienteData.provincia,
          codigo_postal: clienteData.codigo_postal,
          fecha_nacimiento: clienteData.fecha_nacimiento,
          limite_credito: clienteData.limite_credito,
          descuento_aplicable: clienteData.descuento_aplicable,
          notas: clienteData.notas,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error Supabase:', error);
        throw error;
      }

      console.log(`✅ Cliente actualizado: ${data.nombre}`);
      return data;
    } catch (error) {
      console.error('❌ Error en Cliente.actualizar:', error);
      throw error;
    }
  }

  // ============= ELIMINAR (SOFT DELETE) =============
  static async eliminar(id) {
    try {
      console.log(`🗑️ Desactivando cliente ID: ${id}`);

      // Verificar ventas
      const { count: ventasCount } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', id);

      if (ventasCount > 0) {
        throw new Error(
          'No se puede eliminar un cliente con ventas registradas. Use desactivar en su lugar.'
        );
      }

      // Verificar cuentas pendientes
      const { count: cuentasCount } = await supabase
        .from('cuentas_por_cobrar')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', id)
        .eq('estado', 'pendiente');

      if (cuentasCount > 0) {
        throw new Error(
          'No se puede eliminar un cliente con cuentas pendientes'
        );
      }

      // Soft delete
      const { error } = await supabase
        .from('clientes')
        .update({ activo: false })
        .eq('id', id);

      if (error) {
        console.error('❌ Error Supabase:', error);
        throw error;
      }

      console.log('✅ Cliente desactivado correctamente');
      return { mensaje: 'Cliente desactivado correctamente' };
    } catch (error) {
      console.error('❌ Error en Cliente.eliminar:', error);
      throw error;
    }
  }

  // ============= ESTADÍSTICAS =============
  static async obtenerEstadisticas() {
    try {
      console.log('📊 Obteniendo estadísticas de clientes...');

      const { data, error } = await supabase
        .from('clientes')
        .select('tipo_cliente, es_empresa, limite_credito')
        .eq('activo', true);

      if (error) throw error;

      const stats = {
        total_clientes: data.length,
        minoristas: data.filter((c) => c.tipo_cliente === 'minorista').length,
        mayoristas: data.filter((c) => c.tipo_cliente === 'mayorista').length,
        distribuidores: data.filter((c) => c.tipo_cliente === 'distribuidor')
          .length,
        corporativos: data.filter((c) => c.tipo_cliente === 'corporativo')
          .length,
        empresas: data.filter((c) => c.es_empresa).length,
        promedio_limite_credito:
          data.reduce(
            (sum, c) => sum + (parseFloat(c.limite_credito) || 0),
            0
          ) / data.length,
      };

      console.log('✅ Estadísticas calculadas');
      return stats;
    } catch (error) {
      console.error('❌ Error en Cliente.obtenerEstadisticas:', error);
      throw error;
    }
  }

  // ============= TOP CLIENTES =============
  static async obtenerTopClientes(limite = 10) {
    try {
      console.log(`🏆 Obteniendo top ${limite} clientes...`);

      const { data, error } = await supabase
        .from('clientes')
        .select(
          `
          *,
          ventas:ventas(monto, estado)
        `
        )
        .eq('activo', true);

      if (error) throw error;

      // Calcular totales y ordenar
      const clientesConTotales = data
        .map((cliente) => {
          const ventasActivas =
            cliente.ventas?.filter((v) => v.estado === 'activa') || [];
          return {
            ...cliente,
            total_compras: ventasActivas.length,
            monto_total: ventasActivas.reduce(
              (sum, v) => sum + (parseFloat(v.monto) || 0),
              0
            ),
          };
        })
        .filter((c) => c.total_compras > 0)
        .sort((a, b) => b.monto_total - a.monto_total)
        .slice(0, limite);

      console.log(`✅ Top ${clientesConTotales.length} clientes obtenidos`);
      return clientesConTotales;
    } catch (error) {
      console.error('❌ Error en Cliente.obtenerTopClientes:', error);
      throw error;
    }
  }

  // ============= CLIENTES CON DEUDA =============
  static async obtenerClientesConDeuda() {
    try {
      console.log('💰 Obteniendo clientes con deuda...');

      const { data, error } = await supabase
        .from('clientes')
        .select(
          `
          *,
          cuentas:cuentas_por_cobrar(
            monto_pendiente,
            fecha_vencimiento,
            estado
          )
        `
        )
        .eq('activo', true);

      if (error) throw error;

      // Filtrar y calcular deudas
      const clientesConDeuda = data
        .map((cliente) => {
          const cuentasPendientes =
            cliente.cuentas?.filter((c) => c.estado === 'pendiente') || [];
          return {
            ...cliente,
            total_deuda: cuentasPendientes.reduce(
              (sum, c) => sum + (parseFloat(c.monto_pendiente) || 0),
              0
            ),
            facturas_pendientes: cuentasPendientes.length,
            deuda_mas_antigua:
              cuentasPendientes.length > 0
                ? cuentasPendientes.sort(
                    (a, b) =>
                      new Date(a.fecha_vencimiento) -
                      new Date(b.fecha_vencimiento)
                  )[0].fecha_vencimiento
                : null,
          };
        })
        .filter((c) => c.total_deuda > 0)
        .sort((a, b) => b.total_deuda - a.total_deuda);

      console.log(`✅ ${clientesConDeuda.length} clientes con deuda`);
      return clientesConDeuda;
    } catch (error) {
      console.error('❌ Error en Cliente.obtenerClientesConDeuda:', error);
      throw error;
    }
  }
}

module.exports = Cliente;
