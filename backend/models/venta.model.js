import db from '../schemas/db.js';

export const Venta = {
  getAll: async () => {
    const result = await db.query(`
      SELECT v.*, c.nombre AS cliente_nombre, u.username AS usuario_nombre
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      JOIN usuarios u ON v.usuario_id = u.id
      ORDER BY v.fecha_venta DESC
    `);
    return result.rows;
  },

  getById: async (id) => {
    const result = await db.query(
      `
      SELECT v.*, c.nombre AS cliente_nombre, u.username AS usuario_nombre
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = $1
    `,
      [id]
    );
    return result.rows[0];
  },

  createVenta: async (data) => {
    const {
      tipo,
      cliente_id,
      usuario_id,
      monto,
      descripcion,
      fecha_venta,
      comprobante_fiscal,
    } = data;

    // Asegurar que fecha_venta tenga un valor
    const fechaVenta = fecha_venta || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `
    INSERT INTO ventas (tipo, cliente_id, monto, usuario_id, descripcion, fecha_venta, comprobante_fiscal)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `,
      [
        tipo,
        cliente_id,
        monto,
        usuario_id,
        descripcion,
        fechaVenta,
        comprobante_fiscal,
      ]
    );
    return result.rows[0];
  },
};
