import db from '../schemas/db.js';

export const CuentaPorPagar = {
  getAll: async () => {
    const result = await db.query(`
      SELECT cp.*, p.nombre AS proveedor_nombre
      FROM cuentas_por_pagar cp
      JOIN proveedores p ON cp.proveedor_id = p.id
      ORDER BY cp.fecha_vencimiento ASC
    `);
    return result.rows;
  },

  getById: async (id) => {
    const result = await db.query(
      `SELECT * FROM cuentas_por_pagar WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  createCuenta: async (data) => {
    const {
      proveedor_id,
      compra_id,
      monto_total,
      monto_pagado,
      fecha_emision,
      fecha_vencimiento,
      estado,
      notas,
    } = data;

    const result = await db.query(
      `
      INSERT INTO cuentas_por_pagar (
        proveedor_id, compra_id, monto_total, monto_pagado,
        fecha_emision, fecha_vencimiento, estado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
      [
        proveedor_id,
        compra_id || null,
        monto_total,
        monto_pagado || 0,
        fecha_emision,
        fecha_vencimiento,
        estado || 'pendiente',
        notas || null,
      ]
    );

    return { id: result.rows[0].id };
  },
};
