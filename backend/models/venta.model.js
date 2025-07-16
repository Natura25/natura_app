// models/Venta.js o donde tengas tu modelo

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

    // 🔥 VALIDAR y formatear fecha_venta
    let fechaVentaFinal;

    if (fecha_venta) {
      // Si viene fecha, validar que sea válida
      const fechaObj = new Date(fecha_venta);
      if (isNaN(fechaObj.getTime())) {
        throw new Error('Fecha de venta inválida');
      }
      fechaVentaFinal = fechaObj;
    } else {
      // Si no viene fecha, usar fecha actual
      fechaVentaFinal = new Date();
    }

    // Validar campos requeridos
    if (!tipo || !cliente_id || !usuario_id || !monto) {
      throw new Error('Campos requeridos: tipo, cliente_id, usuario_id, monto');
    }

    console.log('🔍 Datos antes de insertar:', {
      tipo,
      cliente_id,
      usuario_id,
      monto,
      descripcion,
      fecha_venta_original: fecha_venta,
      fechaVentaFinal,
      comprobante_fiscal,
    });

    try {
      const result = await db.query(
        `INSERT INTO ventas (tipo, cliente_id, monto, usuario_id, descripcion, fecha_venta, comprobante_fiscal)
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [
          tipo,
          cliente_id,
          parseFloat(monto), // Asegurar que sea número
          usuario_id,
          descripcion || null,
          fechaVentaFinal, // Usar objeto Date, no string
          comprobante_fiscal || false,
        ]
      );

      console.log('✅ Venta creada exitosamente:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('💥 Error en createVenta:', error);
      throw error;
    }
  },

  updateVenta: async (id, data) => {
    const {
      tipo,
      cliente_id,
      usuario_id,
      monto,
      descripcion,
      fecha_venta,
      comprobante_fiscal,
    } = data;

    // Validar y formatear fecha si se proporciona
    let fechaVentaFinal;
    if (fecha_venta) {
      const fechaObj = new Date(fecha_venta);
      if (isNaN(fechaObj.getTime())) {
        throw new Error('Fecha de venta inválida');
      }
      fechaVentaFinal = fechaObj;
    }

    try {
      const result = await db.query(
        `UPDATE ventas 
         SET tipo = $1, cliente_id = $2, monto = $3, usuario_id = $4, 
             descripcion = $5, fecha_venta = $6, comprobante_fiscal = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 
         RETURNING *`,
        [
          tipo,
          cliente_id,
          parseFloat(monto),
          usuario_id,
          descripcion,
          fechaVentaFinal,
          comprobante_fiscal,
          id,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Venta no encontrada');
      }

      return result.rows[0];
    } catch (error) {
      console.error('💥 Error en updateVenta:', error);
      throw error;
    }
  },

  deleteVenta: async (id) => {
    try {
      const result = await db.query(
        'DELETE FROM ventas WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Venta no encontrada');
      }

      return result.rows[0];
    } catch (error) {
      console.error('💥 Error en deleteVenta:', error);
      throw error;
    }
  },
};
