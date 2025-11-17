import { supabase } from '../config/supabase.js';

export const CuentaPorCobrar = {
  // Obtener todas las cuentas con información del cliente
  getAll: async (filters = {}) => {
    let query = supabase
      .from('cuentas_por_cobrar')
      .select(
        `
        *,
        clientes:cliente_id (
          id,
          nombre,
          email,
          telefono
        ),
        ventas:venta_id (
          id,
          numero_factura
        )
      `
      )
      .order('fecha_vencimiento', { ascending: true });

    // Aplicar filtros opcionales
    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    if (filters.cliente_id) {
      query = query.eq('cliente_id', filters.cliente_id);
    }

    if (filters.fecha_desde) {
      query = query.gte('fecha_vencimiento', filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      query = query.lte('fecha_vencimiento', filters.fecha_hasta);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Obtener una cuenta por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .select(
        `
        *,
        clientes:cliente_id (
          id,
          nombre,
          email,
          telefono,
          direccion
        ),
        ventas:venta_id (
          id,
          numero_factura,
          fecha
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Crear nueva cuenta por cobrar
  createCuenta: async (data) => {
    const {
      cliente_id,
      venta_id,
      monto_total,
      fecha_emision,
      fecha_vencimiento,
      notas,
      cuenta_contable_id,
    } = data;

    // Calcular saldo pendiente inicial
    const saldo_pendiente = monto_total;

    const { data: cuenta, error } = await supabase
      .from('cuentas_por_cobrar')
      .insert([
        {
          cliente_id,
          venta_id: venta_id || null,
          monto_total,
          monto_pagado: 0,
          saldo_pendiente,
          fecha_emision,
          fecha_vencimiento,
          estado: 'pendiente',
          notas: notas || null,
          cuenta_contable_id: cuenta_contable_id || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return cuenta;
  },

  // Registrar un pago
  registrarPago: async (
    id,
    montoPago,
    metodoPago = 'efectivo',
    referencia = null
  ) => {
    // 1. Obtener la cuenta actual
    const { data: cuenta, error: errorGet } = await supabase
      .from('cuentas_por_cobrar')
      .select('*')
      .eq('id', id)
      .single();

    if (errorGet) throw errorGet;
    if (!cuenta) throw new Error('Cuenta no encontrada');

    // 2. Validar que el pago no exceda el saldo pendiente
    const nuevoSaldoPendiente =
      parseFloat(cuenta.saldo_pendiente) - parseFloat(montoPago);

    if (nuevoSaldoPendiente < -0.01) {
      throw new Error('El monto del pago excede el saldo pendiente');
    }

    const nuevoMontoPagado =
      parseFloat(cuenta.monto_pagado) + parseFloat(montoPago);
    const nuevoEstado = nuevoSaldoPendiente <= 0.01 ? 'pagado' : cuenta.estado;

    // 3. Actualizar la cuenta por cobrar
    const { data: cuentaActualizada, error: errorUpdate } = await supabase
      .from('cuentas_por_cobrar')
      .update({
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: Math.max(0, nuevoSaldoPendiente),
        estado: nuevoEstado,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (errorUpdate) throw errorUpdate;

    // 4. Registrar el pago en el historial
    const { error: errorPago } = await supabase
      .from('pagos_cuentas_por_cobrar')
      .insert([
        {
          cuenta_por_cobrar_id: id,
          monto: montoPago,
          metodo_pago: metodoPago,
          referencia,
          fecha_pago: new Date().toISOString(),
        },
      ]);

    if (errorPago) throw errorPago;

    return cuentaActualizada;
  },

  // Actualizar cuenta
  update: async (id, data) => {
    const { data: cuenta, error } = await supabase
      .from('cuentas_por_cobrar')
      .update({
        ...data,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return cuenta;
  },

  // Eliminar cuenta
  delete: async (id) => {
    const { error } = await supabase
      .from('cuentas_por_cobrar')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  // Marcar cuentas vencidas (ejecutar diariamente con cron)
  marcarVencidas: async () => {
    const hoy = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .update({ estado: 'vencido' })
      .lt('fecha_vencimiento', hoy)
      .eq('estado', 'pendiente')
      .select();

    if (error) throw error;
    return data;
  },

  // Dashboard - Resumen de cuentas por cobrar
  getDashboard: async (cliente_id = null) => {
    let query = supabase
      .from('cuentas_por_cobrar')
      .select('monto_total, saldo_pendiente, estado, fecha_vencimiento');

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const hoy = new Date().toISOString().split('T')[0];

    const resumen = {
      total_por_cobrar: 0,
      total_pendiente: 0,
      total_vencido: 0,
      total_pagado: 0,
      cantidad_pendiente: 0,
      cantidad_vencida: 0,
      cantidad_pagada: 0,
      proximas_a_vencer: 0, // próximos 7 días
    };

    data.forEach((cuenta) => {
      const saldo = parseFloat(cuenta.saldo_pendiente || 0);
      const monto = parseFloat(cuenta.monto_total || 0);

      resumen.total_por_cobrar += monto;

      if (cuenta.estado === 'pagado') {
        resumen.total_pagado += monto;
        resumen.cantidad_pagada++;
      } else if (cuenta.estado === 'vencido') {
        resumen.total_vencido += saldo;
        resumen.cantidad_vencida++;
        resumen.total_pendiente += saldo;
      } else {
        resumen.total_pendiente += saldo;
        resumen.cantidad_pendiente++;

        // Verificar si vence en los próximos 7 días
        const diasParaVencer = Math.ceil(
          (new Date(cuenta.fecha_vencimiento) - new Date(hoy)) /
            (1000 * 60 * 60 * 24)
        );

        if (diasParaVencer >= 0 && diasParaVencer <= 7) {
          resumen.proximas_a_vencer++;
        }
      }
    });

    return resumen;
  },

  // Obtener historial de pagos de una cuenta
  getHistorialPagos: async (cuenta_id) => {
    const { data, error } = await supabase
      .from('pagos_cuentas_por_cobrar')
      .select('*')
      .eq('cuenta_por_cobrar_id', cuenta_id)
      .order('fecha_pago', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Obtener cuentas por cliente
  getByCliente: async (cliente_id) => {
    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .select(
        `
        *,
        clientes:cliente_id (
          id,
          nombre,
          email
        )
      `
      )
      .eq('cliente_id', cliente_id)
      .order('fecha_vencimiento', { ascending: true });

    if (error) throw error;
    return data;
  },
};
