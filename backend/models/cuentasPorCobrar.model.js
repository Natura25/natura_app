import db from '../schemas/db.js';

export const CuentaPorCobrar = {
  getAll: async () => {
    const result = await db.query(`
        SELECT c.*, cl.nombre AS cliente_nombre
        FROM cuentas_por_cobrar c
        JOIN clientes cl ON c.cliente_id = cl.id
        ORDER BY c.fecha_vencimiento ASC
      `);
    return result.rows;
  },

  getById: async (id) => {
    const result = await db.query(
      `
        SELECT * FROM cuentas_por_cobrar WHERE id = $1
      `,
      [id]
    );
    return result.rows[0];
  },

  createCuenta: async (data) => {
    const {
      cliente_id,
      venta_id,
      monto_total,
      monto_pagado,
      fecha_emision,
      fecha_vencimiento,
      estado,
      notas,
    } = data;

    const result = await db.query(
      `
        INSERT INTO cuentas_por_cobrar (
          cliente_id, venta_id, monto_total, monto_pagado,
          fecha_emision, fecha_vencimiento, estado, notas
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        cliente_id,
        venta_id || null,
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
