import { supabase } from '../config/supabase.js';

export const ProveedoresModel = {
  /**
   * Crear nuevo proveedor
   */
  async crear(datos) {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .insert([datos])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creando proveedor:', error);
      throw error;
    }
  },

  /**
   * Buscar proveedor por ID
   */
  async obtenerPorId(id) {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select(
          `
          *,
          compras:compras(count),
          cuentas_por_pagar:cuentas_por_pagar(
            id,
            monto_total,
            monto_pagado,
            estado,
            fecha_vencimiento
          )
        `
        )
        .eq('id', id)
        .single();

      if (error && error.code === 'PGRST116') {
        return null;
      }

      if (error) throw error;

      // Calcular estadísticas
      const totalCompras = data.compras[0]?.count || 0;
      const cuentasPendientes = data.cuentas_por_pagar.filter(
        (c) => c.estado !== 'pagado'
      );
      const deudaTotal = cuentasPendientes.reduce(
        (sum, c) =>
          sum + (parseFloat(c.monto_total) - parseFloat(c.monto_pagado)),
        0
      );

      return {
        ...data,
        estadisticas: {
          total_compras: totalCompras,
          cuentas_pendientes: cuentasPendientes.length,
          deuda_total: deudaTotal.toFixed(2),
        },
      };
    } catch (error) {
      console.error('Error obteniendo proveedor por ID:', error);
      throw error;
    }
  },

  /**
   * Consultar proveedores con filtros
   */
  async consultar({ buscar, page = 1, limit = 20, ordenar = 'nombre' }) {
    try {
      let query = supabase.from('proveedores').select('*', { count: 'exact' });

      // Búsqueda por texto
      if (buscar && buscar.trim() !== '') {
        const busqueda = `%${buscar.trim()}%`;
        query = query.or(
          `nombre.ilike.${busqueda},rnc.ilike.${busqueda},email.ilike.${busqueda},telefono.ilike.${busqueda}`
        );
      }

      // Ordenamiento
      const ordenValido = ['nombre', 'creado_en', 'rnc'];
      const campoOrden = ordenValido.includes(ordenar) ? ordenar : 'nombre';
      query = query.order(campoOrden, { ascending: campoOrden === 'nombre' });

      // Paginación
      const from = (page - 1) * limit;
      const to = from + parseInt(limit) - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
        filtros_aplicados: {
          buscar: buscar || null,
          ordenar: campoOrden,
        },
      };
    } catch (error) {
      console.error('Error consultando proveedores:', error);
      throw error;
    }
  },

  /**
   * Actualizar proveedor
   */
  async actualizar(id, datos) {
    try {
      const updateData = {
        ...datos,
        actualizado_en: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('proveedores')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      throw error;
    }
  },

  /**
   * Eliminar proveedor
   */
  async eliminar(id) {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error && error.code === 'PGRST116') {
        return null;
      }

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      throw error;
    }
  },

  /**
   * Buscar proveedor por RNC
   */
  async buscarPorRNC(rnc) {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('rnc', rnc)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error buscando proveedor por RNC:', error);
      throw error;
    }
  },

  /**
   * Buscar proveedor por email
   */
  async buscarPorEmail(email) {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error buscando proveedor por email:', error);
      throw error;
    }
  },

  /**
   * Obtener historial de compras
   */
  async obtenerHistorialCompras(
    proveedorId,
    { fecha_desde, fecha_hasta, page = 1, limit = 10 }
  ) {
    try {
      let query = supabase
        .from('compras')
        .select('*', { count: 'exact' })
        .eq('proveedor_id', proveedorId)
        .order('fecha', { ascending: false });

      // Filtros de fecha
      if (fecha_desde) {
        query = query.gte('fecha', fecha_desde);
      }
      if (fecha_hasta) {
        query = query.lte('fecha', fecha_hasta);
      }

      // Paginación
      const from = (page - 1) * limit;
      const to = from + parseInt(limit) - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Calcular total gastado
      const totalGastado = data.reduce(
        (sum, compra) => sum + parseFloat(compra.total),
        0
      );

      return {
        compras: data,
        estadisticas: {
          total_compras: count,
          total_gastado: totalGastado.toFixed(2),
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error('Error obteniendo historial de compras:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los proveedores activos (lista simple)
   */
  async obtenerActivos() {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre, telefono, email')
        .order('nombre', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error obteniendo proveedores activos:', error);
      throw error;
    }
  },

  /**
   * Contar total de proveedores
   */
  async contarTotal() {
    try {
      const { count, error } = await supabase
        .from('proveedores')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return count;
    } catch (error) {
      console.error('Error contando proveedores:', error);
      throw error;
    }
  },

  /**
   * Verificar si un proveedor tiene compras
   */
  async tieneCompras(proveedorId) {
    try {
      const { count, error } = await supabase
        .from('compras')
        .select('*', { count: 'exact', head: true })
        .eq('proveedor_id', proveedorId);

      if (error) throw error;

      return count > 0;
    } catch (error) {
      console.error('Error verificando compras del proveedor:', error);
      throw error;
    }
  },

  /**
   * Verificar si un proveedor tiene inventario asociado
   */
  async tieneInventario(proveedorId) {
    try {
      const { count, error } = await supabase
        .from('inventario')
        .select('*', { count: 'exact', head: true })
        .eq('proveedor_id', proveedorId);

      if (error) throw error;

      return count > 0;
    } catch (error) {
      console.error('Error verificando inventario del proveedor:', error);
      throw error;
    }
  },

  /**
   * Obtener proveedores con deudas pendientes
   */
  async obtenerConDeudas() {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select(
          `
          *,
          cuentas_por_pagar!inner(
            id,
            monto_total,
            monto_pagado,
            estado,
            fecha_vencimiento
          )
        `
        )
        .in('cuentas_por_pagar.estado', ['pendiente', 'vencido', 'parcial'])
        .order('nombre', { ascending: true });

      if (error) throw error;

      // Calcular deuda total por proveedor
      const proveedoresConDeuda = data.map((proveedor) => {
        const deudaTotal = proveedor.cuentas_por_pagar.reduce((sum, cuenta) => {
          return (
            sum +
            (parseFloat(cuenta.monto_total) - parseFloat(cuenta.monto_pagado))
          );
        }, 0);

        return {
          ...proveedor,
          deuda_total: deudaTotal.toFixed(2),
          cuentas_pendientes: proveedor.cuentas_por_pagar.length,
        };
      });

      return proveedoresConDeuda;
    } catch (error) {
      console.error('Error obteniendo proveedores con deudas:', error);
      throw error;
    }
  },

  /**
   * Obtener top proveedores por volumen de compras
   */
  async obtenerTopPorCompras(limite = 10) {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select(
          `
          *,
          compras(
            total
          )
        `
        )
        .order('nombre', { ascending: true });

      if (error) throw error;

      // Calcular totales y ordenar
      const proveedoresConTotales = data
        .map((proveedor) => {
          const totalCompras = proveedor.compras.reduce(
            (sum, compra) => sum + parseFloat(compra.total),
            0
          );

          return {
            id: proveedor.id,
            nombre: proveedor.nombre,
            telefono: proveedor.telefono,
            email: proveedor.email,
            total_compras: totalCompras.toFixed(2),
            cantidad_compras: proveedor.compras.length,
          };
        })
        .filter((p) => p.cantidad_compras > 0)
        .sort(
          (a, b) => parseFloat(b.total_compras) - parseFloat(a.total_compras)
        )
        .slice(0, limite);

      return proveedoresConTotales;
    } catch (error) {
      console.error('Error obteniendo top proveedores:', error);
      throw error;
    }
  },

  /**
   * Buscar proveedores por término de búsqueda
   */
  async buscar(termino, limite = 10) {
    try {
      const busqueda = `%${termino}%`;
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre, rnc, telefono, email')
        .or(
          `nombre.ilike.${busqueda},rnc.ilike.${busqueda},email.ilike.${busqueda}`
        )
        .order('nombre', { ascending: true })
        .limit(limite);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error buscando proveedores:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas generales de proveedores
   */
  async obtenerEstadisticas() {
    try {
      // Contar total de proveedores
      const { count: totalProveedores } = await supabase
        .from('proveedores')
        .select('*', { count: 'exact', head: true });

      // Obtener proveedores con compras
      const { data: compras } = await supabase
        .from('compras')
        .select('proveedor_id, total');

      const proveedoresConCompras = new Set(compras.map((c) => c.proveedor_id))
        .size;

      const totalComprado = compras.reduce(
        (sum, c) => sum + parseFloat(c.total),
        0
      );

      // Obtener cuentas por pagar pendientes
      const { data: cuentasPendientes } = await supabase
        .from('cuentas_por_pagar')
        .select('monto_total, monto_pagado')
        .in('estado', ['pendiente', 'vencido', 'parcial']);

      const deudaTotal = cuentasPendientes.reduce(
        (sum, c) =>
          sum + (parseFloat(c.monto_total) - parseFloat(c.monto_pagado)),
        0
      );

      return {
        total_proveedores: totalProveedores,
        proveedores_activos: proveedoresConCompras,
        total_comprado: totalComprado.toFixed(2),
        deuda_total: deudaTotal.toFixed(2),
        cuentas_pendientes: cuentasPendientes.length,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de proveedores:', error);
      throw error;
    }
  },
};
