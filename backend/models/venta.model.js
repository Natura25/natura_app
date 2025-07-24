import db from '../schemas/db.js';
import { registrarMovimientoContable } from '../utils/movimientosService.js';

//! ============= CONFIGURACIÓN DE CUENTAS CONTABLES =============
const CUENTAS = {
  CAJA: 8, // 1.1 - Caja (para ventas al contado)
  BANCOS: 9, // 1.2 - Bancos (opcional para depósitos)
  CUENTAS_POR_COBRAR: 10, // 1.3 - Cuentas por cobrar (ventas a crédito)
  INVENTARIO: 11, // 1.4 - Inventario (para costo de ventas)
  VENTAS_PRODUCTOS: 22, // 4.1 - Ventas de productos (principal)
  INGRESOS_SERVICIOS: 23, // 4.2 - Ingresos por servicios (secundario)
  COSTO_VENTAS: 24, // 5.1 - Costo de ventas
  CUENTAS_POR_PAGAR: 16, // 2.1 - Cuentas por pagar
  IMPUESTOS_POR_PAGAR: 18, // 2.3 - Impuestos por pagar (ITBIS, etc.)
};

class VentaModel {
  //! ============= MÉTODOS DE CONSULTA =============

  /**
   * Obtener todas las ventas con filtros opcionales
   */
  static async findAll(filtros = {}) {
    const {
      fecha_inicio,
      fecha_fin,
      forma_pago,
      cliente_id,
      estado = 'activa',
    } = filtros;

    let query = `
      SELECT 
        v.id, v.tipo, v.forma_pago, v.monto, v.fecha_venta,
        v.descripcion, v.comprobante_fiscal,
        c.nombre as cliente_nombre,
        u.nombre as usuario_nombre,
        CASE 
          WHEN v.forma_pago = 'credito' THEN COALESCE(cxc.saldo_pendiente, v.monto)
          ELSE 0 
        END as saldo_pendiente
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id  
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN cuentas_por_cobrar cxc ON v.id = cxc.venta_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (fecha_inicio && fecha_fin) {
      query += ` AND v.fecha_venta BETWEEN $${paramIndex} AND $${
        paramIndex + 1
      }`;
      params.push(fecha_inicio, fecha_fin);
      paramIndex += 2;
    }

    if (forma_pago) {
      query += ` AND v.forma_pago = $${paramIndex}`;
      params.push(forma_pago);
      paramIndex++;
    }

    if (cliente_id) {
      query += ` AND v.cliente_id = $${paramIndex}`;
      params.push(cliente_id);
      paramIndex++;
    }

    query += ` ORDER BY v.fecha_venta DESC, v.id DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Buscar venta por ID
   */
  static async findById(id) {
    const result = await db.query(
      `
      SELECT 
        v.*,
        c.nombre as cliente_nombre, c.telefono as cliente_telefono,
        u.nombre as usuario_nombre,
        CASE 
          WHEN v.forma_pago = 'credito' THEN COALESCE(cxc.saldo_pendiente, v.monto)
          ELSE 0 
        END as saldo_pendiente
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id  
      LEFT JOIN cuentas_por_cobrar cxc ON v.id = cxc.venta_id
      WHERE v.id = $1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Verificar si existe un cliente
   */
  static async clienteExiste(cliente_id) {
    const result = await db.query('SELECT id FROM clientes WHERE id = $1', [
      cliente_id,
    ]);
    return result.rows.length > 0;
  }

  //! ============= MÉTODOS DE CREACIÓN =============

  /**
   * Crear una nueva venta con transacción completa
   */
  static async create(ventaData) {
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

    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Preparar fecha_venta
      const fechaVentaFinal = fecha_venta ? new Date(fecha_venta) : new Date();

      // Calcular montos
      const monto_neto = monto - descuento;
      const monto_total = monto_neto + itbis;

      // 1. Insertar venta principal
      const ventaRes = await client.query(
        `INSERT INTO ventas (
          cliente_id, monto, usuario_id, descripcion, fecha_venta, 
          tipo, comprobante_fiscal, forma_pago, cuenta_contable_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id`,
        [
          cliente_id,
          parseFloat(monto_total),
          usuario_id,
          descripcion || null,
          fechaVentaFinal,
          tipo,
          comprobante_fiscal,
          forma_pago,
          cuenta_contable_id || null,
        ]
      );

      const ventaId = ventaRes.rows[0].id;

      // 2. Insertar items si existen
      if (items && items.length > 0) {
        await this._insertarItems(client, ventaId, items);
      }

      // 3. Procesar según forma de pago
      if (forma_pago === 'credito') {
        await this._procesarVentaCredito(client, {
          ventaId,
          cliente_id,
          monto_total,
          cuenta_contable_id,
          descripcion,
          usuario_id,
        });
      } else {
        await this._procesarVentaContado(client, {
          ventaId,
          monto_total,
          descripcion,
          usuario_id,
        });
      }

      // 4. Registrar ingreso por venta
      const monto_sin_impuesto = monto_total - itbis;
      await this._registrarIngresoVenta(client, {
        ventaId,
        monto: monto_sin_impuesto,
        forma_pago,
        descripcion,
        usuario_id,
      });

      // 5. Registrar ITBIS si existe
      if (itbis > 0) {
        await this._registrarITBIS(client, {
          ventaId,
          itbis,
          descripcion,
          usuario_id,
        });
      }

      await client.query('COMMIT');

      return {
        venta_id: ventaId,
        forma_pago,
        monto_total,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  //! ============= MÉTODOS DE ACTUALIZACIÓN =============

  /**
   * Actualizar una venta existente
   */
  static async update(id, datosActualizacion) {
    const {
      cliente_id,
      monto,
      usuario_id,
      descripcion,
      fecha_venta,
      tipo,
      comprobante_fiscal,
      forma_pago,
      cuenta_contable_id,
    } = datosActualizacion;

    // Preparar fecha si se proporciona
    let fechaVentaFinal;
    if (fecha_venta) {
      fechaVentaFinal = new Date(fecha_venta);
      if (isNaN(fechaVentaFinal.getTime())) {
        throw new Error('Fecha de venta inválida');
      }
    }

    const result = await db.query(
      `UPDATE ventas 
       SET cliente_id = COALESCE($1, cliente_id), 
           monto = COALESCE($2, monto), 
           usuario_id = COALESCE($3, usuario_id), 
           descripcion = COALESCE($4, descripcion), 
           fecha_venta = COALESCE($5, fecha_venta), 
           tipo = COALESCE($6, tipo), 
           comprobante_fiscal = COALESCE($7, comprobante_fiscal),
           forma_pago = COALESCE($8, forma_pago),
           cuenta_contable_id = COALESCE($9, cuenta_contable_id),
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $10 
       RETURNING *`,
      [
        cliente_id,
        monto ? parseFloat(monto) : null,
        usuario_id,
        descripcion,
        fechaVentaFinal,
        tipo,
        comprobante_fiscal,
        forma_pago,
        cuenta_contable_id,
        id,
      ]
    );

    return result.rows[0] || null;
  }

  //! ============= MÉTODOS DE ELIMINACIÓN =============

  /**
   * Eliminar una venta y todos sus registros relacionados
   */
  static async delete(id) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Eliminar registros relacionados primero
      await client.query('DELETE FROM cuentas_por_cobrar WHERE venta_id = $1', [
        id,
      ]);
      await client.query(
        'DELETE FROM movimientos_contables WHERE origen_tabla = $1 AND origen_id = $2',
        ['ventas', id]
      );
      await client.query('DELETE FROM venta_items WHERE venta_id = $1', [id]);

      // Eliminar la venta
      const result = await client.query(
        'DELETE FROM ventas WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Venta no encontrada');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Anular una venta (más profesional que eliminar)
   */
  static async anular(id, motivo_anulacion, usuario_id) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Verificar que la venta existe
      const ventaResult = await client.query(
        'SELECT * FROM ventas WHERE id = $1',
        [id]
      );

      if (ventaResult.rows.length === 0) {
        throw new Error('Venta no encontrada');
      }

      const venta = ventaResult.rows[0];

      // Anular la venta
      await client.query(
        `UPDATE ventas SET 
          descripcion = CONCAT(COALESCE(descripcion, ''), ' [ANULADA: ', $1, ']'),
          actualizado_en = CURRENT_TIMESTAMP 
        WHERE id = $2`,
        [motivo_anulacion, id]
      );

      // Crear asientos contables de reversión
      await this._registrarMovimientosAnulacion(client, venta, usuario_id);

      // Si era a crédito, anular la cuenta por cobrar
      if (venta.forma_pago === 'credito') {
        await client.query(
          'UPDATE cuentas_por_cobrar SET estado = $1 WHERE venta_id = $2',
          ['anulada', id]
        );
      }

      await client.query('COMMIT');
      return venta;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  //! ============= MÉTODOS DE REPORTES =============

  /**
   * Generar reporte de ventas agrupado
   */
  static async generarReporte(filtros = {}) {
    const {
      fecha_inicio,
      fecha_fin,
      forma_pago,
      agrupado_por = 'dia',
    } = filtros;

    let query = `
      SELECT 
        DATE_TRUNC($1, v.fecha_venta) as periodo,
        v.forma_pago,
        COUNT(*) as cantidad_ventas,
        SUM(v.monto) as total_ventas,
        AVG(v.monto) as promedio_venta
      FROM ventas v
      WHERE 1=1
    `;

    const params = [agrupado_por];
    let paramIndex = 2;

    if (fecha_inicio && fecha_fin) {
      query += ` AND v.fecha_venta BETWEEN $${paramIndex} AND $${
        paramIndex + 1
      }`;
      params.push(fecha_inicio, fecha_fin);
      paramIndex += 2;
    }

    if (forma_pago) {
      query += ` AND v.forma_pago = $${paramIndex}`;
      params.push(forma_pago);
    }

    query += `
      GROUP BY DATE_TRUNC($1, v.fecha_venta), v.forma_pago
      ORDER BY periodo DESC, v.forma_pago
    `;

    const result = await db.query(query, params);
    return result.rows;
  }

  //! ============= MÉTODOS PRIVADOS DE APOYO =============

  /**
   * Insertar items de una venta
   */
  static async _insertarItems(client, ventaId, items) {
    for (const item of items) {
      await client.query(
        `INSERT INTO venta_items (
          venta_id, producto_id, cantidad, precio_unitario, subtotal
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          ventaId,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
        ]
      );
    }
  }

  /**
   * Procesar venta a crédito
   */
  static async _procesarVentaCredito(client, data) {
    const {
      ventaId,
      cliente_id,
      monto_total,
      cuenta_contable_id,
      descripcion,
      usuario_id,
    } = data;

    // Insertar en cuentas_por_cobrar
    await client.query(
      `INSERT INTO cuentas_por_cobrar (
        cliente_id, venta_id, monto_total, saldo_pendiente,
        fecha_emision, fecha_vencimiento, cuenta_contable_id, estado
      ) VALUES ($1, $2, $3, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $4, 'pendiente')`,
      [
        cliente_id,
        ventaId,
        monto_total,
        cuenta_contable_id || CUENTAS.CUENTAS_POR_COBRAR,
      ]
    );

    // Movimiento contable: Débito a Cuentas por Cobrar
    await registrarMovimientoContable({
      cuenta_id: cuenta_contable_id || CUENTAS.CUENTAS_POR_COBRAR,
      origen_tabla: 'ventas',
      origen_id: ventaId,
      descripcion: `Venta a crédito - ${descripcion || 'Sin descripción'}`,
      debe: monto_total,
      haber: 0,
      creado_por: usuario_id,
    });
  }

  /**
   * Procesar venta al contado
   */
  static async _procesarVentaContado(client, data) {
    const { ventaId, monto_total, descripcion, usuario_id } = data;

    // Movimiento contable: Débito a Caja
    await registrarMovimientoContable({
      cuenta_id: CUENTAS.CAJA,
      origen_tabla: 'ventas',
      origen_id: ventaId,
      descripcion: `Venta al contado - ${descripcion || 'Sin descripción'}`,
      debe: monto_total,
      haber: 0,
      creado_por: usuario_id,
    });
  }

  /**
   * Registrar ingreso por venta
   */
  static async _registrarIngresoVenta(client, data) {
    const { ventaId, monto, forma_pago, descripcion, usuario_id } = data;

    await registrarMovimientoContable({
      cuenta_id: CUENTAS.VENTAS_PRODUCTOS,
      origen_tabla: 'ventas',
      origen_id: ventaId,
      descripcion: `Ingreso por venta ${forma_pago} - ${
        descripcion || 'Sin descripción'
      }`,
      debe: 0,
      haber: monto,
      creado_por: usuario_id,
    });
  }

  /**
   * Registrar ITBIS por pagar
   */
  static async _registrarITBIS(client, data) {
    const { ventaId, itbis, descripcion, usuario_id } = data;

    await registrarMovimientoContable({
      cuenta_id: CUENTAS.IMPUESTOS_POR_PAGAR,
      origen_tabla: 'ventas',
      origen_id: ventaId,
      descripcion: `ITBIS por venta - ${descripcion || 'Sin descripción'}`,
      debe: 0,
      haber: itbis,
      creado_por: usuario_id,
    });
  }

  /**
   * Registrar movimientos contables de anulación
   */
  static async _registrarMovimientosAnulacion(client, venta, usuario_id) {
    const { id, forma_pago, monto, descripcion } = venta;

    // Revertir los asientos originales
    if (forma_pago === 'contado') {
      // Crédito a Caja (disminuye el efectivo)
      await registrarMovimientoContable({
        cuenta_id: CUENTAS.CAJA,
        origen_tabla: 'ventas',
        origen_id: id,
        descripcion: `Anulación venta al contado #${id} - ${descripcion}`,
        debe: 0,
        haber: monto,
        creado_por: usuario_id,
      });
    } else {
      // Crédito a Cuentas por Cobrar
      await registrarMovimientoContable({
        cuenta_id: CUENTAS.CUENTAS_POR_COBRAR,
        origen_tabla: 'ventas',
        origen_id: id,
        descripcion: `Anulación venta a crédito #${id} - ${descripcion}`,
        debe: 0,
        haber: monto,
        creado_por: usuario_id,
      });
    }

    // Débito a Ingresos (disminuye los ingresos)
    await registrarMovimientoContable({
      cuenta_id: CUENTAS.VENTAS_PRODUCTOS,
      origen_tabla: 'ventas',
      origen_id: id,
      descripcion: `Anulación ingreso venta #${id} - ${descripcion}`,
      debe: monto,
      haber: 0,
      creado_por: usuario_id,
    });
  }

  //! ============= MÉTODOS DE VALIDACIÓN =============

  /**
   * Validar datos de venta
   */
  static validarDatosVenta(ventaData) {
    const { cliente_id, monto, usuario_id, forma_pago } = ventaData;

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

    return errores;
  }

  //! ============= GETTERS PARA CONSTANTES =============

  static get CUENTAS() {
    return CUENTAS;
  }
}

export default VentaModel;
