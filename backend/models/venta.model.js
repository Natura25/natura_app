// backend/models/venta.model.js - VERSIÓN CORREGIDA

import { supabase } from '../config/supabase.js';
import inventarioModel from './inventario.model.js';

//! ============= CONFIGURACIÓN DE CUENTAS CONTABLES =============
const CUENTAS = {
  CAJA: 8, // 1.1 - Caja (para ventas al contado)
  BANCOS: 9, // 1.2 - Bancos
  CUENTAS_POR_COBRAR: 10, // 1.3 - Cuentas por cobrar (ventas a crédito)
  INVENTARIO: 11, // 1.4 - Inventario
  VENTAS_PRODUCTOS: 22, // 4.1 - Ventas de productos
  INGRESOS_SERVICIOS: 23, // 4.2 - Ingresos por servicios
  COSTO_VENTAS: 24, // 5.1 - Costo de ventas
  CUENTAS_POR_PAGAR: 16, // 2.1 - Cuentas por pagar
  IMPUESTOS_POR_PAGAR: 18, // 2.3 - Impuestos por pagar (ITBIS)
};

export default {
  //! ============= MÉTODOS DE CONSULTA =============

  /**
   * Obtener todas las ventas con filtros opcionales
   */
  async findAll(filtros = {}) {
    try {
      const {
        fecha_inicio,
        fecha_fin,
        forma_pago,
        cliente_id,
        estado = 'activa',
      } = filtros;

      let query = supabase
        .from('ventas')
        .select(
          `
          *,
          cliente:clientes(id, nombre, telefono, email),
          usuario:usuarios!fk_ventas_auth_id(auth_id, nombre, email),
          items:venta_items(
            id,
            cantidad,
            precio_unitario,
            subtotal,
            producto:inventario(id, codigo, nombre, precio_venta)
          )
        `
        )
        .order('fecha_venta', { ascending: false });

      // Aplicar filtros
      if (fecha_inicio && fecha_fin) {
        query = query
          .gte('fecha_venta', fecha_inicio)
          .lte('fecha_venta', fecha_fin);
      }

      if (forma_pago) {
        query = query.eq('forma_pago', forma_pago);
      }

      if (cliente_id) {
        query = query.eq('cliente_id', cliente_id);
      }

      if (estado) {
        query = query.eq('estado', estado);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular saldo pendiente para ventas a crédito
      const ventasConSaldo = await Promise.all(
        data.map(async (venta) => {
          if (venta.forma_pago === 'credito') {
            const saldo = await this._obtenerSaldoPendiente(venta.id);
            return { ...venta, saldo_pendiente: saldo };
          }
          return { ...venta, saldo_pendiente: 0 };
        })
      );

      return ventasConSaldo;
    } catch (error) {
      console.error('❌ Error obteniendo ventas:', error);
      throw error;
    }
  },

  /**
   * Buscar venta por ID
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(
          `
          *,
          cliente:clientes(id, nombre, telefono, email, direccion),
          usuario:usuarios!fk_ventas_auth_id(auth_id, nombre, email),
          items:venta_items(
            id,
            cantidad,
            precio_unitario,
            subtotal,
            producto:inventario(id, codigo, nombre, precio_venta, unidad_medida)
          ),
          cuenta_contable:cuentas_contables(id, codigo, nombre)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Obtener saldo pendiente si es crédito
      if (data.forma_pago === 'credito') {
        data.saldo_pendiente = await this._obtenerSaldoPendiente(id);
      } else {
        data.saldo_pendiente = 0;
      }

      return data;
    } catch (error) {
      console.error('❌ Error obteniendo venta por ID:', error);
      throw error;
    }
  },

  /**
   * Verificar si existe un cliente
   */
  async clienteExiste(cliente_id) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', cliente_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('❌ Error verificando cliente:', error);
      throw error;
    }
  },

  //! ============= MÉTODOS DE CREACIÓN =============

  /**
   * Crear una nueva venta con transacción completa
   */
  async create(ventaData) {
    const {
      cliente_id,
      monto,
      usuario_id,
      descripcion,
      fecha_venta,
      tipo = 'manual',
      comprobante_fiscal = false,
      forma_pago = 'contado',
      cuenta_contable_id,
      descuento = 0,
      itbis = 0,
      items = [],
    } = ventaData;

    try {
      // Calcular montos
      const monto_neto = monto - descuento;
      const monto_total = monto_neto + itbis;
      const fechaVentaFinal = fecha_venta ? new Date(fecha_venta) : new Date();

      // 1. Crear la venta principal
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert([
          {
            cliente_id,
            monto: parseFloat(monto_total),
            usuario_id,
            descripcion: descripcion || null,
            fecha_venta: fechaVentaFinal.toISOString(),
            tipo,
            comprobante_fiscal,
            forma_pago,
            cuenta_contable_id: cuenta_contable_id || null,
            estado: 'activa',
            creado_por: usuario_id,
          },
        ])
        .select()
        .single();

      if (ventaError) throw ventaError;

      const ventaId = venta.id;

      // 2. Insertar items y actualizar inventario
      if (items && items.length > 0) {
        await this._procesarItems(ventaId, items, usuario_id);
      }

      // 3. Procesar según forma de pago
      if (forma_pago === 'credito') {
        await this._procesarVentaCredito({
          ventaId,
          cliente_id,
          monto_total,
          cuenta_contable_id,
          descripcion,
          usuario_id,
        });
      } else {
        await this._procesarVentaContado({
          ventaId,
          monto_total,
          descripcion,
          usuario_id,
        });
      }

      // 4. Registrar movimientos contables
      const monto_sin_impuesto = monto_total - itbis;
      await this._registrarIngresoVenta({
        ventaId,
        monto: monto_sin_impuesto,
        forma_pago,
        descripcion,
        usuario_id,
      });

      // 5. Registrar ITBIS si existe
      if (itbis > 0) {
        await this._registrarITBIS({
          ventaId,
          itbis,
          descripcion,
          usuario_id,
        });
      }

      console.log(
        `✅ Venta creada: ID ${ventaId}, Forma: ${forma_pago}, Monto: $${monto_total}`
      );

      return {
        venta_id: ventaId,
        forma_pago,
        monto_total,
        venta_completa: await this.findById(ventaId),
      };
    } catch (error) {
      console.error('❌ Error creando venta:', error);
      throw error;
    }
  },

  //! ============= MÉTODOS DE ACTUALIZACIÓN =============

  /**
   * Actualizar una venta existente
   */
  async update(id, datosActualizacion) {
    try {
      const updateData = {
        actualizado_en: new Date().toISOString(),
      };

      // Solo actualizar campos proporcionados
      if (datosActualizacion.cliente_id !== undefined)
        updateData.cliente_id = datosActualizacion.cliente_id;
      if (datosActualizacion.monto !== undefined)
        updateData.monto = parseFloat(datosActualizacion.monto);
      if (datosActualizacion.descripcion !== undefined)
        updateData.descripcion = datosActualizacion.descripcion;
      if (datosActualizacion.fecha_venta !== undefined)
        updateData.fecha_venta = new Date(
          datosActualizacion.fecha_venta
        ).toISOString();
      if (datosActualizacion.tipo !== undefined)
        updateData.tipo = datosActualizacion.tipo;
      if (datosActualizacion.comprobante_fiscal !== undefined)
        updateData.comprobante_fiscal = datosActualizacion.comprobante_fiscal;
      if (datosActualizacion.forma_pago !== undefined)
        updateData.forma_pago = datosActualizacion.forma_pago;
      if (datosActualizacion.cuenta_contable_id !== undefined)
        updateData.cuenta_contable_id = datosActualizacion.cuenta_contable_id;

      const { data, error } = await supabase
        .from('ventas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error actualizando venta:', error);
      throw error;
    }
  },

  //! ============= MÉTODOS DE ELIMINACIÓN =============

  /**
   * Eliminar una venta completamente
   */
  async delete(id) {
    try {
      // Primero obtener la venta para restaurar inventario
      const venta = await this.findById(id);
      if (!venta) throw new Error('Venta no encontrada');

      // Restaurar inventario de los items
      if (venta.items && venta.items.length > 0) {
        for (const item of venta.items) {
          await inventarioModel.actualizarStock(
            item.producto.id,
            item.cantidad, // Devolver al inventario
            'ajuste_entrada'
          );
        }
      }

      // Eliminar registros relacionados
      await supabase.from('cuentas_por_cobrar').delete().eq('venta_id', id);
      await supabase
        .from('movimientos_contables')
        .delete()
        .eq('origen_tabla', 'ventas')
        .eq('origen_id', id);
      await supabase.from('venta_items').delete().eq('venta_id', id);

      // Eliminar la venta
      const { data, error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(`🗑️ Venta eliminada: ID ${id}`);
      return data;
    } catch (error) {
      console.error('❌ Error eliminando venta:', error);
      throw error;
    }
  },

  /**
   * Anular una venta (recomendado sobre eliminar)
   */
  async anular(id, motivo_anulacion, usuario_id) {
    try {
      // Obtener la venta
      const venta = await this.findById(id);
      if (!venta) throw new Error('Venta no encontrada');

      // Restaurar inventario
      if (venta.items && venta.items.length > 0) {
        for (const item of venta.items) {
          await inventarioModel.actualizarStock(
            item.producto.id,
            item.cantidad,
            'ajuste_entrada'
          );
        }
      }

      // Anular la venta
      const { data, error } = await supabase
        .from('ventas')
        .update({
          estado: 'anulada',
          descripcion: `${
            venta.descripcion || ''
          } [ANULADA: ${motivo_anulacion}]`,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Anular cuenta por cobrar si es crédito
      if (venta.forma_pago === 'credito') {
        await supabase
          .from('cuentas_por_cobrar')
          .update({ estado: 'anulada' })
          .eq('venta_id', id);
      }

      // Registrar movimientos de anulación
      await this._registrarMovimientosAnulacion(venta, usuario_id);

      console.log(`❌ Venta anulada: ID ${id}, Motivo: ${motivo_anulacion}`);
      return data;
    } catch (error) {
      console.error('❌ Error anulando venta:', error);
      throw error;
    }
  },

  //! ============= MÉTODOS DE REPORTES =============

  /**
   * Generar reporte de ventas
   */
  async generarReporte(filtros = {}) {
    try {
      const {
        fecha_inicio,
        fecha_fin,
        forma_pago,
        agrupado_por = 'dia',
      } = filtros;

      let query = supabase.from('ventas').select('*').eq('estado', 'activa');

      if (fecha_inicio && fecha_fin) {
        query = query
          .gte('fecha_venta', fecha_inicio)
          .lte('fecha_venta', fecha_fin);
      }

      if (forma_pago) {
        query = query.eq('forma_pago', forma_pago);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar datos
      const reporte = this._agruparVentas(data, agrupado_por);

      return reporte;
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      throw error;
    }
  },

  //! ============= MÉTODOS PRIVADOS =============

  /**
   * Procesar items de venta y actualizar inventario
   */
  async _procesarItems(ventaId, items, usuario_id) {
    try {
      for (const item of items) {
        // Insertar item de venta
        const { error: itemError } = await supabase.from('venta_items').insert([
          {
            venta_id: ventaId,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          },
        ]);

        if (itemError) throw itemError;

        // Actualizar inventario (restar cantidad)
        await inventarioModel.actualizarStock(
          item.producto_id,
          -item.cantidad, // Negativo para restar
          'salida'
        );

        console.log(
          `📉 Inventario actualizado: Producto ${item.producto_id}, Cantidad: -${item.cantidad}`
        );
      }
    } catch (error) {
      console.error('❌ Error procesando items:', error);
      throw error;
    }
  },

  /**
   * Obtener saldo pendiente de una venta a crédito
   */
  async _obtenerSaldoPendiente(ventaId) {
    try {
      const { data, error } = await supabase
        .from('cuentas_por_cobrar')
        .select('saldo_pendiente')
        .eq('venta_id', ventaId)
        .eq('estado', 'pendiente')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.saldo_pendiente || 0;
    } catch (error) {
      console.error('❌ Error obteniendo saldo pendiente:', error);
      return 0;
    }
  },

  /**
   * Procesar venta a crédito
   */
  async _procesarVentaCredito(data) {
    const { ventaId, cliente_id, monto_total, cuenta_contable_id, usuario_id } =
      data;

    try {
      // Insertar en cuentas por cobrar
      const { error } = await supabase.from('cuentas_por_cobrar').insert([
        {
          cliente_id,
          venta_id: ventaId,
          monto_total,
          saldo_pendiente: monto_total,
          fecha_emision: new Date().toISOString(),
          fecha_vencimiento: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          cuenta_contable_id: cuenta_contable_id || CUENTAS.CUENTAS_POR_COBRAR,
          estado: 'pendiente',
          creado_por: usuario_id,
        },
      ]);

      if (error) throw error;

      // Registrar movimiento contable
      await this._registrarMovimientoContable({
        cuenta_id: cuenta_contable_id || CUENTAS.CUENTAS_POR_COBRAR,
        origen_tabla: 'ventas',
        origen_id: ventaId,
        descripcion: `Venta a crédito #${ventaId}`,
        debe: monto_total,
        haber: 0,
        creado_por: usuario_id,
      });
    } catch (error) {
      console.error('❌ Error procesando venta a crédito:', error);
      throw error;
    }
  },

  /**
   * Procesar venta al contado
   */
  async _procesarVentaContado(data) {
    const { ventaId, monto_total, usuario_id } = data;

    try {
      await this._registrarMovimientoContable({
        cuenta_id: CUENTAS.CAJA,
        origen_tabla: 'ventas',
        origen_id: ventaId,
        descripcion: `Venta al contado #${ventaId}`,
        debe: monto_total,
        haber: 0,
        creado_por: usuario_id,
      });
    } catch (error) {
      console.error('❌ Error procesando venta al contado:', error);
      throw error;
    }
  },

  /**
   * Registrar ingreso por venta
   */
  async _registrarIngresoVenta(data) {
    const { ventaId, monto, usuario_id } = data;

    try {
      await this._registrarMovimientoContable({
        cuenta_id: CUENTAS.VENTAS_PRODUCTOS,
        origen_tabla: 'ventas',
        origen_id: ventaId,
        descripcion: `Ingreso por venta #${ventaId}`,
        debe: 0,
        haber: monto,
        creado_por: usuario_id,
      });
    } catch (error) {
      console.error('❌ Error registrando ingreso:', error);
      throw error;
    }
  },

  /**
   * Registrar ITBIS por pagar
   */
  async _registrarITBIS(data) {
    const { ventaId, itbis, usuario_id } = data;

    try {
      await this._registrarMovimientoContable({
        cuenta_id: CUENTAS.IMPUESTOS_POR_PAGAR,
        origen_tabla: 'ventas',
        origen_id: ventaId,
        descripcion: `ITBIS venta #${ventaId}`,
        debe: 0,
        haber: itbis,
        creado_por: usuario_id,
      });
    } catch (error) {
      console.error('❌ Error registrando ITBIS:', error);
      throw error;
    }
  },

  /**
   * Registrar movimiento contable
   */
  async _registrarMovimientoContable(movimiento) {
    try {
      const { error } = await supabase
        .from('movimientos_contables')
        .insert([movimiento]);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error registrando movimiento contable:', error);
      throw error;
    }
  },

  /**
   * Registrar movimientos de anulación
   */
  async _registrarMovimientosAnulacion(venta, usuario_id) {
    const { id, forma_pago, monto } = venta;

    try {
      if (forma_pago === 'contado') {
        await this._registrarMovimientoContable({
          cuenta_id: CUENTAS.CAJA,
          origen_tabla: 'ventas',
          origen_id: id,
          descripcion: `Anulación venta al contado #${id}`,
          debe: 0,
          haber: monto,
          creado_por: usuario_id,
        });
      } else {
        await this._registrarMovimientoContable({
          cuenta_id: CUENTAS.CUENTAS_POR_COBRAR,
          origen_tabla: 'ventas',
          origen_id: id,
          descripcion: `Anulación venta a crédito #${id}`,
          debe: 0,
          haber: monto,
          creado_por: usuario_id,
        });
      }

      await this._registrarMovimientoContable({
        cuenta_id: CUENTAS.VENTAS_PRODUCTOS,
        origen_tabla: 'ventas',
        origen_id: id,
        descripcion: `Anulación ingreso venta #${id}`,
        debe: monto,
        haber: 0,
        creado_por: usuario_id,
      });
    } catch (error) {
      console.error('❌ Error registrando movimientos de anulación:', error);
      throw error;
    }
  },

  /**
   * Agrupar ventas para reportes
   */
  _agruparVentas(ventas, agrupado_por) {
    const agrupado = {};

    ventas.forEach((venta) => {
      const fecha = new Date(venta.fecha_venta);
      let periodo;

      switch (agrupado_por) {
        case 'mes':
          periodo = `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1
          ).padStart(2, '0')}`;
          break;
        case 'año':
          periodo = `${fecha.getFullYear()}`;
          break;
        default: // 'dia'
          periodo = fecha.toISOString().split('T')[0];
      }

      const key = `${periodo}_${venta.forma_pago}`;

      if (!agrupado[key]) {
        agrupado[key] = {
          periodo,
          forma_pago: venta.forma_pago,
          cantidad_ventas: 0,
          total_ventas: 0,
        };
      }

      agrupado[key].cantidad_ventas++;
      agrupado[key].total_ventas += parseFloat(venta.monto);
    });

    return Object.values(agrupado).map((item) => ({
      ...item,
      promedio_venta: item.total_ventas / item.cantidad_ventas,
    }));
  },

  //! ============= MÉTODOS DE VALIDACIÓN =============

  /**
   * Validar datos de venta
   */
  validarDatosVenta(ventaData) {
    const { cliente_id, monto, usuario_id, forma_pago, items } = ventaData;

    const errores = [];

    if (!cliente_id || !monto || !usuario_id) {
      errores.push('Campos requeridos: cliente_id, monto, usuario_id');
    }

    if (typeof monto !== 'number' || isNaN(monto)) {
      errores.push('Monto debe ser un número válido');
    }

    if (monto <= 0) {
      errores.push('El monto debe ser mayor a cero');
    }

    if (forma_pago && !['contado', 'credito'].includes(forma_pago)) {
      errores.push('forma_pago debe ser "contado" o "credito"');
    }

    if (items && items.length > 0) {
      items.forEach((item, index) => {
        if (!item.producto_id || !item.cantidad || !item.precio_unitario) {
          errores.push(
            `Item ${
              index + 1
            }: requiere producto_id, cantidad y precio_unitario`
          );
        }
      });
    }

    return errores;
  },

  //! ============= GETTERS =============

  get CUENTAS() {
    return CUENTAS;
  },
};
