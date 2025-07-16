import { Venta } from '../models/venta.model.js';
import db from '../schemas/db.js';
import { registrarMovimientoContable } from '../utils/movimientosService.js';

const ID_CUENTA_CXC = 7; // ← ID real de "Cuentas por cobrar"
const ID_CUENTA_INGRESOS = 13; // ← ID real de "Ingresos por ventas"

export const getVentas = async (req, res) => {
  try {
    const ventas = await Venta.getAll();
    res.json(ventas);
  } catch (error) {
    console.error('💥 Error al obtener venta:', error);
    res.status(500).json({ error: 'Error al obtener las ventas' });
  }
};

export async function getVentaById(req, res) {
  try {
    const venta = await Venta.getById(req.params.id);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json(venta);
  } catch (error) {
    console.error('Error al obtener venta por ID:', error);
    res.status(500).json({ error: 'Error al obtener la venta' });
  }
}

// 🔄 Nueva versión con lógica contable integrada - CORREGIDA
export async function createVenta(req, res) {
  const {
    cliente_id,
    monto,
    usuario_id,
    descripcion,
    fecha_venta,
    tipo,
    comprobante_fiscal,
  } = req.body;

  // Validación de campos requeridos
  if (!cliente_id || !monto || !usuario_id) {
    return res.status(400).json({
      error: 'Campos requeridos: cliente_id, monto, usuario_id',
    });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Preparar fecha_venta: usar la proporcionada o la fecha actual
    const fechaVentaFinal = fecha_venta ? new Date(fecha_venta) : new Date();

    // Validar que la fecha sea válida
    if (isNaN(fechaVentaFinal.getTime())) {
      return res.status(400).json({ error: 'Fecha de venta inválida' });
    }

    console.log('📝 Datos para insertar venta:', {
      cliente_id,
      monto,
      usuario_id,
      descripcion,
      fecha_venta: fechaVentaFinal,
      tipo: tipo || 'manual',
      comprobante_fiscal: comprobante_fiscal || false,
    });

    // 1. Insertar venta CON TODOS LOS CAMPOS NECESARIOS
    const ventaRes = await client.query(
      `INSERT INTO ventas (
        cliente_id, 
        monto, 
        usuario_id, 
        descripcion, 
        fecha_venta, 
        tipo, 
        comprobante_fiscal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id`,
      [
        cliente_id,
        parseFloat(monto),
        usuario_id,
        descripcion || null,
        fechaVentaFinal, // ← ¡AQUÍ ESTÁ LA CORRECCIÓN!
        tipo || 'manual',
        comprobante_fiscal || false,
      ]
    );

    const ventaId = ventaRes.rows[0].id;
    console.log('✅ Venta creada con ID:', ventaId);

    // 2. Insertar en cuentas_por_cobrar
    await client.query(
      `INSERT INTO cuentas_por_cobrar (
        cliente_id, 
        venta_id, 
        monto_total, 
        fecha_emision, 
        fecha_vencimiento
      ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')`,
      [cliente_id, ventaId, monto]
    );

    // 3. Registrar movimientos contables
    await registrarMovimientoContable({
      cuenta_id: ID_CUENTA_CXC,
      origen_tabla: 'ventas',
      origen_id: ventaId,
      descripcion: 'Cuenta por cobrar generada por venta',
      debe: monto,
      haber: 0,
      creado_por: usuario_id,
    });

    await registrarMovimientoContable({
      cuenta_id: ID_CUENTA_INGRESOS,
      origen_tabla: 'ventas',
      origen_id: ventaId,
      descripcion: 'Ingreso por venta',
      debe: 0,
      haber: monto,
      creado_por: usuario_id,
    });

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Venta registrada con movimientos contables',
      venta_id: ventaId,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('💥 Error real al registrar venta:', error);
    res.status(500).json({
      error: 'Error al registrar la venta',
      details: error.message,
    });
  } finally {
    client.release();
  }
}

// Función para actualizar venta
export async function updateVenta(req, res) {
  const { id } = req.params;
  const {
    cliente_id,
    monto,
    usuario_id,
    descripcion,
    fecha_venta,
    tipo,
    comprobante_fiscal,
  } = req.body;

  try {
    // Preparar fecha si se proporciona
    let fechaVentaFinal;
    if (fecha_venta) {
      fechaVentaFinal = new Date(fecha_venta);
      if (isNaN(fechaVentaFinal.getTime())) {
        return res.status(400).json({ error: 'Fecha de venta inválida' });
      }
    }

    const result = await db.query(
      `UPDATE ventas 
       SET cliente_id = $1, monto = $2, usuario_id = $3, descripcion = $4, 
           fecha_venta = COALESCE($5, fecha_venta), tipo = COALESCE($6, tipo), 
           comprobante_fiscal = COALESCE($7, comprobante_fiscal),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [
        cliente_id,
        parseFloat(monto),
        usuario_id,
        descripcion,
        fechaVentaFinal,
        tipo,
        comprobante_fiscal,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({
      message: 'Venta actualizada exitosamente',
      venta: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({
      error: 'Error al actualizar venta',
      details: error.message,
    });
  }
}

// Función para eliminar venta
export async function deleteVenta(req, res) {
  const { id } = req.params;

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

    // Eliminar la venta
    const result = await client.query(
      'DELETE FROM ventas WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Venta eliminada exitosamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar venta:', error);
    res.status(500).json({
      error: 'Error al eliminar venta',
      details: error.message,
    });
  } finally {
    client.release();
  }
}
