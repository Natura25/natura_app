// models/cliente.model.js
import { supabase } from '../config/supabase.js';

export default class Cliente {
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

      if (filtros.tipo_cliente)
        query = query.eq('tipo_cliente', filtros.tipo_cliente);
      if (filtros.ciudad) query = query.eq('ciudad', filtros.ciudad);
      if (filtros.provincia) query = query.eq('provincia', filtros.provincia);

      query = query.order('nombre', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

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
          cuentas:cuentas_por_cobrar(id, monto_pendiente, fecha_vencimiento, estado)
        `
        )
        .eq('id', id)
        .eq('activo', true)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw error;

      const ventasActivas =
        data.ventas?.filter((v) => v.estado === 'activa') || [];
      const cuentasPendientes =
        data.cuentas?.filter((c) => c.estado === 'pendiente') || [];

      return {
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
        .select('*, cuentas:cuentas_por_cobrar(monto_pendiente)')
        .eq('activo', true);

      if (criterios.cedula)
        query = query.ilike('cedula', `%${criterios.cedula}%`);
      if (criterios.rnc) query = query.ilike('rnc', `%${criterios.rnc}%`);
      if (criterios.nombre)
        query = query.or(
          `nombre.ilike.%${criterios.nombre}%,nombre_comercial.ilike.%${criterios.nombre}%`
        );
      if (criterios.telefono)
        query = query.ilike('telefono', `%${criterios.telefono}%`);
      if (criterios.email) query = query.ilike('email', `%${criterios.email}%`);
      if (criterios.tipo_cliente)
        query = query.eq('tipo_cliente', criterios.tipo_cliente);
      if (criterios.ciudad) query = query.eq('ciudad', criterios.ciudad);

      query = query.order('nombre', { ascending: true }).limit(50);

      const { data, error } = await query;
      if (error) throw error;

      return data.map((cliente) => ({
        ...cliente,
        saldo_pendiente:
          cliente.cuentas?.reduce(
            (sum, c) => sum + (parseFloat(c.monto_pendiente) || 0),
            0
          ) || 0,
      }));
    } catch (error) {
      console.error('❌ Error en Cliente.buscar:', error);
      throw error;
    }
  }

  // ============= CREAR =============
  static async crear(clienteData) {
    try {
      console.log('➕ Creando cliente:', clienteData.nombre);

      const camposDuplicados = ['cedula', 'rnc', 'email'];
      for (const campo of camposDuplicados) {
        if (clienteData[campo]) {
          const { data: existente } = await supabase
            .from('clientes')
            .select('id')
            .eq(campo, clienteData[campo])
            .eq('activo', true)
            .single();
          if (existente)
            throw new Error(`Ya existe un cliente con ese ${campo}`);
        }
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert([{ ...clienteData, activo: true }])
        .select()
        .single();

      if (error) throw error;
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

      const clienteExiste = await this.obtenerPorId(id);
      if (!clienteExiste) throw new Error('Cliente no encontrado');

      const { data, error } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log(`✅ Cliente actualizado: ${data.nombre}`);
      return data;
    } catch (error) {
      console.error('❌ Error en Cliente.actualizar:', error);
      throw error;
    }
  }

  // ============= ELIMINAR =============
  static async eliminar(id) {
    try {
      console.log(`🗑️ Desactivando cliente ID: ${id}`);

      const { count: ventasCount } = await supabase
        .from('ventas')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', id);

      if (ventasCount > 0)
        throw new Error(
          'No se puede eliminar un cliente con ventas registradas.'
        );

      const { count: cuentasCount } = await supabase
        .from('cuentas_por_cobrar')
        .select('*', { count: 'exact', head: true })
        .eq('cliente_id', id)
        .eq('estado', 'pendiente');

      if (cuentasCount > 0)
        throw new Error(
          'No se puede eliminar un cliente con cuentas pendientes'
        );

      const { error } = await supabase
        .from('clientes')
        .update({ activo: false })
        .eq('id', id);
      if (error) throw error;

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

      return stats;
    } catch (error) {
      console.error('❌ Error en Cliente.obtenerEstadisticas:', error);
      throw error;
    }
  }

  // ============= TOP CLIENTES =============
  static async obtenerTopClientes(limite = 10) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, ventas:ventas(monto, estado)')
        .eq('activo', true);
      if (error) throw error;

      return data
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
    } catch (error) {
      console.error('❌ Error en Cliente.obtenerTopClientes:', error);
      throw error;
    }
  }

  // ============= CLIENTES CON DEUDA =============
  static async obtenerClientesConDeuda() {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select(
          '*, cuentas:cuentas_por_cobrar(monto_pendiente, fecha_vencimiento, estado)'
        )
        .eq('activo', true);
      if (error) throw error;

      return data
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
    } catch (error) {
      console.error('❌ Error en Cliente.obtenerClientesConDeuda:', error);
      throw error;
    }
  }
}
