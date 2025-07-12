import { Venta } from '../models/venta.model.js';
import db from '../db/db.js';
import { registrarMovimientoContable } from '../services/movimientosService.js';

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

// 🔄 Nueva versión con lógica contable integrada
export async function createVenta(req, res) {
  const { cliente_id, monto, usuario_id, descripcion } = req.body;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar venta
    const ventaRes = await client.query(
      `INSERT INTO ventas (cliente_id, monto, usuario_id, descripcion) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [cliente_id, monto, usuario_id, descripcion]
    );
    const ventaId = ventaRes.rows[0].id;

    // 2. Insertar en cuentas_por_cobrar
    await client.query(
      `INSERT INTO cuentas_por_cobrar (cliente_id, venta_id, monto_total, fecha_emision, fecha_vencimiento) 
       VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')`,
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
    res.status(500).json({ error: 'Error al registrar la venta' });
  } finally {
    client.release();
  }
}
