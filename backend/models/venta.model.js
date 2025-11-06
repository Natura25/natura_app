// backend/models/venta.model.js - VERSIÓN FINAL CORREGIDA

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
      console.log('📋 Obteniendo ventas con filtros:', filtros);

      const { fecha_inicio, fecha_fin, forma_pago, cliente_id } = filtros;

      let query = supabase
        .from('ventas')
        .select(
          `
          *,
          cliente:clientes(id, nombre, telefono, email),
          usuario:usuarios(auth_id, username, email),
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

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error obteniendo ventas:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} ventas obtenidas`);

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
      const ventaId = parseInt(id);
      if (isNaN(ventaId)) {
        console.error('❌ ID inválido:', id);
        return null;
      }

      const { data, error } = await supabase
        .from('ventas')
        .select(
          `
          *,
          cliente:clientes(id, nombre, telefono, email, direccion),
          usuario:usuarios(auth_id, username, email),
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
        .eq('id', ventaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Obtener saldo pendiente si es crédito
      if (data.forma_pago === 'credito') {
        data.saldo_pendiente = await this._obtenerSaldoPendiente(ventaId);
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
      auth_id, // ✅ CAMBIADO de usuario_id a auth_id
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
      console.log('➕ Creando venta:', {
        cliente_id,
        monto,
        auth_id,
        descripcion,
        forma_pago,
        descuento,
        itbis,
        items: items.length,
      });

      // Validar auth_id
      if (!auth_id) {
        throw new Error('auth_id es requerido');
      }

      // Calcular montos
      const monto_neto = monto - descuento;
      const monto_total = monto_neto + itbis;
      const fechaVentaFinal = fecha_venta ? new Date(fecha_venta) : new Date();

      // 1. Crear la venta principal
      const ventaInsert = {
        cliente_id: parseInt(cliente_id),
        monto: parseFloat(monto_total),
        auth_id, // ✅ Usar auth_id en lugar de usuario_id
        descripcion: descripcion || null,
        fecha_venta: fechaVentaFinal.toISOString().split('T')[0],
        tipo,
        comprobante_fiscal,
        forma_pago,
        cuenta_contable_id: cuenta_contable_id || null,
        descuento: parseFloat(descuento),
        itbis: parseFloat(itbis),
        monto_neto: parseFloat(monto_neto),
        monto_total: parseFloat(monto_total),
      };

      console.log('📝 Insertando venta:', ventaInsert);

      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert([ventaInsert])
        .select()
        .single();

      if (ventaError) {
        console.error('❌ Error insertando venta:', ventaError);
        throw ventaError;
      }

      const ventaId = venta.id;
      console.log(`✅ Venta creada con ID: ${ventaId}`);

      // 2. Insertar items y actualizar inventario
      if (items && items.length > 0) {
        await this._procesarItems(ventaId, items, auth_id);
      }

      // 3. Procesar según forma de pago
      if (forma_pago === 'credito') {
        await this._procesarVentaCredito({
          ventaId,
          cliente_id,
          monto_total,
          cuenta_contable_id,
          descripcion,
          auth_id, // ✅ CAMBIADO
        });
      } else {
        await this._procesarVentaContado({
          ventaId,
          monto_total,
          descripcion,
          auth_id, // ✅ CAMBIADO
        });
      }

      // 4. Registrar movimientos contables
      const monto_sin_impuesto = monto_total - itbis;
      await this._registrarIngresoVenta({
        ventaId,
        monto: monto_sin_impuesto,
        forma_pago,
        descripcion,
        auth_id, // ✅ CAMBIADO
      });

      // 5. Registrar ITBIS si existe
      if (itbis > 0) {
        await this._registrarITBIS({
          ventaId,
          itbis,
          descripcion,
          auth_id, // ✅ CAMBIADO
        });
      }

      console.log(
        `✅ Venta completa: ID ${ventaId}, Forma: ${forma_pago}, Monto: $${monto_total}`
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

  async update(id, datosActualizacion) {
    try {
      const updateData = {
        actualizado_en: new Date().toISOString(),
      };

      if (datosActualizacion.cliente_id !== undefined)
        updateData.cliente_id = parseInt(datosActualizacion.cliente_id);
      if (datosActualizacion.monto !== undefined)
        updateData.monto = parseFloat(datosActualizacion.monto);
      if (datosActualizacion.descripcion !== undefined)
        updateData.descripcion = datosActualizacion.descripcion;
      if (datosActualizacion.fecha_venta !== undefined)
        updateData.fecha_venta = new Date(datosActualizacion.fecha_venta)
          .toISOString()
          .split('T')[0];
      if (datosActualizacion.tipo !== undefined)
        updateData.tipo = datosActualizacion.tipo;
      if (datosActualizacion.comprobante_fiscal !== undefined)
        updateData.comprobante_fiscal = datosActualizacion.comprobante_fiscal;
      if (datosActualizacion.forma_pago !== undefined)
        updateData.forma_pago = datosActualizacion.forma_pago;

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

  async delete(id) {
    try {
      const venta = await this.findById(id);
      if (!venta) throw new Error('Venta no encontrada');

      // Restaurar inventario
      if (venta.items && venta.items.length > 0) {
        for (const item of venta.items) {
          await inventarioModel.actualizarStock(
            item.producto.id,
            item.cantidad,
            'ajuste'
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

  async anular(id, motivo_anulacion, auth_id) {
    // ✅ CAMBIADO parámetro
    try {
      const venta = await this.findById(id);
      if (!venta) throw new Error('Venta no encontrada');

      // Restaurar inventario
      if (venta.items && venta.items.length > 0) {
        for (const item of venta.items) {
          await inventarioModel.actualizarStock(
            item.producto.id,
            item.cantidad,
            'ajuste'
          );
        }
      }

      // Anular la venta
      const { data, error } = await supabase
        .from('ventas')
        .update({
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
      await this._registrarMovimientosAnulacion(venta, auth_id); // ✅ CAMBIADO

      console.log(`❌ Venta anulada: ID ${id}, Motivo: ${motivo_anulacion}`);
      return data;
    } catch (error) {
      console.error('❌ Error anulando venta:', error);
      throw error;
    }
  },

  //! ============= MÉTODOS DE REPORTES =============

  async generarReporte(filtros = {}) {
    try {
      const {
        fecha_inicio,
        fecha_fin,
        forma_pago,
        agrupado_por = 'dia',
      } = filtros;

      let query = supabase.from('ventas').select('*');

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

      const reporte = this._agruparVentas(data, agrupado_por);

      return reporte;
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      throw error;
    }
  },

  //! ============= MÉTODOS PRIVADOS =============

  async _procesarItems(ventaId, items, auth_id) {
    try {
      console.log('🔄 Procesando items para venta:', ventaId);
      console.log('📦 Items recibidos:', JSON.stringify(items, null, 2));

      for (const item of items) {
        if (!item.producto_id) {
          throw new Error(`Item sin producto_id: ${JSON.stringify(item)}`);
        }

        let producto_id_inventario;

        // ✅ Detectar si es UUID (productos_servicios) o INTEGER (inventario)
        const esUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            item.producto_id
          );

        if (esUUID) {
          console.log(
            '🔄 producto_id es UUID, buscando en producto_inventario...'
          );

          // Buscar el inventario_id correspondiente
          const { data: relacion, error: errorRelacion } = await supabase
            .from('producto_inventario')
            .select('inventario_id')
            .eq('producto_servicio_id', item.producto_id)
            .eq('es_producto_principal', true)
            .single();

          if (errorRelacion || !relacion) {
            throw new Error(
              `No se encontró inventario para producto_servicio_id: ${item.producto_id}. ` +
                `Asegúrate de que el producto esté vinculado en la tabla producto_inventario.`
            );
          }

          producto_id_inventario = relacion.inventario_id;
          console.log(
            `✅ UUID ${item.producto_id} → Inventario ID ${producto_id_inventario}`
          );
        } else {
          // Ya es un INTEGER de inventario
          producto_id_inventario = parseInt(item.producto_id, 10);

          if (isNaN(producto_id_inventario)) {
            throw new Error(`producto_id inválido: ${item.producto_id}`);
          }
        }

        // ✅ Verificar que el producto existe en inventario
        const { data: productoExiste, error: errorCheck } = await supabase
          .from('inventario')
          .select('id, codigo, nombre, cantidad')
          .eq('id', producto_id_inventario)
          .single();

        if (errorCheck || !productoExiste) {
          throw new Error(
            `Producto ${producto_id_inventario} no encontrado en inventario`
          );
        }

        console.log('✅ Producto encontrado:', productoExiste);

        // ✅ Verificar stock disponible
        if (productoExiste.cantidad < item.cantidad) {
          throw new Error(
            `Stock insuficiente para ${productoExiste.nombre}. ` +
              `Disponible: ${productoExiste.cantidad}, Solicitado: ${item.cantidad}`
          );
        }

        // ✅ Preparar datos del item
        const itemData = {
          venta_id: parseInt(ventaId, 10),
          producto_id: producto_id_inventario,
          cantidad: parseFloat(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal),
        };

        console.log('📝 Insertando item:', itemData);

        // ✅ Insertar en venta_items
        const { data: itemInsertado, error: itemError } = await supabase
          .from('venta_items')
          .insert([itemData])
          .select()
          .single();

        if (itemError) {
          console.error('❌ Error insertando item:', itemError);
          console.error('📋 Item que causó error:', itemData);
          throw itemError;
        }

        console.log('✅ Item insertado:', itemInsertado);

        // ✅ Actualizar inventario
        await inventarioModel.actualizarStock(
          producto_id_inventario,
          -item.cantidad,
          'salida'
        );

        console.log(
          `📉 Stock actualizado: ${productoExiste.nombre} (ID: ${producto_id_inventario}), -${item.cantidad}`
        );
      }

      console.log('✅ Todos los items procesados correctamente');
    } catch (error) {
      console.error('❌ Error procesando items:', error);
      throw error;
    }
  },

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
      return 0;
    }
  },

  async _procesarVentaCredito(data) {
    const { ventaId, cliente_id, monto_total, cuenta_contable_id, auth_id } =
      data; // ✅ CAMBIADO

    try {
      const { error } = await supabase.from('cuentas_por_cobrar').insert([
        {
          cliente_id: parseInt(cliente_id),
          venta_id: ventaId,
          monto_total: parseFloat(monto_total),
          saldo_pendiente: parseFloat(monto_total),
          monto_pagado: 0,
          fecha_emision: new Date().toISOString().split('T')[0],
          fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          cuenta_contable_id: cuenta_contable_id || CUENTAS.CUENTAS_POR_COBRAR,
          estado: 'pendiente',
        },
      ]);

      if (error) throw error;

      await this._registrarMovimientoContable({
        cuenta_id: cuenta_contable_id || CUENTAS.CUENTAS_POR_COBRAR,
        origen_tabla: 'ventas',
        origen_id: ventaId,
        descripcion: `Venta a crédito #${ventaId}`,
        debe: parseFloat(monto_total),
        haber: 0,
        creado_por: auth_id, // ✅ CAMBIADO
      });

      console.log(`💳 Cuenta por cobrar creada para venta #${ventaId}`);
    } catch (error) {
      console.error('❌ Error procesando venta a crédito:', error);
      throw error;
    }
  },

  async _procesarVentaContado(data) {
    const { ventaId, monto_total, auth_id } = data; // ✅ CAMBIADO

    try {
      await this._registrarMovimientoContable({
        cuenta_id: CUENTAS.CAJA,
        origen_tabla: 'ventas',
        origen_id: ventaId,
        descripcion: `Venta al contado #${ventaId}`,
        debe: parseFloat(monto_total),
        haber: 0,
        creado_por: auth_id, // ✅ CAMBIADO
      });

      console.log(`💵 Registro de caja para venta #${ventaId}`);
    } catch (error) {
      console.error('❌ Error procesando venta al contado:', error);
      throw error;
    }
  },

  async _registrarIngresoVenta(data) {
    const { ventaId, monto, auth_id } = data; // ✅ CAMBIADO

    try {
      await this._registrarMovimientoContable({
        cuenta_id: CUENTAS.VENTAS_PRODUCTOS,
        origen_tabla: 'ventas',
        origen_id: ventaId,
        descripcion: `Ingreso por venta #${ventaId}`,
        debe: 0,
        haber: parseFloat(monto),
        creado_por: auth_id, // ✅ CAMBIADO
      });
    } catch (error) {
      console.error('❌ Error registrando ingreso:', error);
      throw error;
    }
  },

  async _registrarITBIS(data) {
    const { ventaId, itbis, auth_id } = data; // ✅ CAMBIADO

    try {
      await this._registrarMovimientoContable({
        cuenta_id: CUENTAS.IMPUESTOS_POR_PAGAR,
        origen_tabla: 'ventas',
        origen_id: ventaId,
        descripcion: `ITBIS venta #${ventaId}`,
        debe: 0,
        haber: parseFloat(itbis),
        creado_por: auth_id, // ✅ CAMBIADO
      });
    } catch (error) {
      console.error('❌ Error registrando ITBIS:', error);
      throw error;
    }
  },

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

  async _registrarMovimientosAnulacion(venta, auth_id) {
    // ✅ CAMBIADO parámetro
    const { id, forma_pago, monto } = venta;

    try {
      if (forma_pago === 'contado') {
        await this._registrarMovimientoContable({
          cuenta_id: CUENTAS.CAJA,
          origen_tabla: 'ventas',
          origen_id: id,
          descripcion: `Anulación venta al contado #${id}`,
          debe: 0,
          haber: parseFloat(monto),
          creado_por: auth_id, // ✅ CAMBIADO
        });
      } else {
        await this._registrarMovimientoContable({
          cuenta_id: CUENTAS.CUENTAS_POR_COBRAR,
          origen_tabla: 'ventas',
          origen_id: id,
          descripcion: `Anulación venta a crédito #${id}`,
          debe: 0,
          haber: parseFloat(monto),
          creado_por: auth_id, // ✅ CAMBIADO
        });
      }

      await this._registrarMovimientoContable({
        cuenta_id: CUENTAS.VENTAS_PRODUCTOS,
        origen_tabla: 'ventas',
        origen_id: id,
        descripcion: `Anulación ingreso venta #${id}`,
        debe: parseFloat(monto),
        haber: 0,
        creado_por: auth_id, // ✅ CAMBIADO
      });
    } catch (error) {
      console.error('❌ Error registrando movimientos de anulación:', error);
      throw error;
    }
  },

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
        default:
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

  validarDatosVenta(ventaData) {
    const { cliente_id, monto, auth_id, forma_pago, items } = ventaData; // ✅ CAMBIADO
    const errores = [];

    if (!cliente_id || !monto || !auth_id) {
      // ✅ CAMBIADO
      errores.push('Campos requeridos: cliente_id, monto, auth_id');
    }

    if (typeof monto !== 'number' || isNaN(monto) || monto <= 0) {
      errores.push('Monto debe ser un número válido mayor a cero');
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
        if (item.cantidad <= 0 || item.precio_unitario <= 0) {
          errores.push(`Item ${index + 1}: cantidad y precio deben ser > 0`);
        }
      });
    }

    return errores;
  },

  get CUENTAS() {
    return CUENTAS;
  },
};
