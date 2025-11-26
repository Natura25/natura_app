import db from '../schemas/db.js';

export async function crearCuentaPorPagar({
  proveedor_id,
  compra_id,
  monto_total,
  monto_pagado = 0,
  fecha_emision,
  fecha_vencimiento,
  estado = 'pendiente',
  notas,
  creado_por,
}) {
  const result = await db.query(
    `INSERT INTO cuentas_por_pagar (
      proveedor_id, compra_id, monto_total, monto_pagado,
      fecha_emision, fecha_vencimiento, estado, notas,
      creado_por, actualizado_por
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
    RETURNING *`,
    [
      proveedor_id,
      compra_id,
      monto_total,
      monto_pagado,
      fecha_emision,
      fecha_vencimiento,
      estado,
      notas,
      creado_por,
    ]
  );
  return result.rows[0];
}

export async function obtenerCuentasPorPagar() {
  const result = await db.query(
    `SELECT * FROM cuentas_por_pagar ORDER BY fecha_vencimiento ASC`
  );
  return result.rows;
}

export async function obtenerCuentaPorPagarPorId(id) {
  const result = await db.query(
    `SELECT * FROM cuentas_por_pagar WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function actualizarCuentaPorPagar(id, data) {
  const {
    proveedor_id,
    compra_id,
    monto_total,
    monto_pagado,
    fecha_emision,
    fecha_vencimiento,
    estado,
    notas,
    actualizado_por,
  } = data;

  const result = await db.query(
    `UPDATE cuentas_por_pagar SET
      proveedor_id = $1,
      compra_id = $2,
      monto_total = $3,
      monto_pagado = $4,
      fecha_emision = $5,
      fecha_vencimiento = $6,
      estado = $7,
      notas = $8,
      actualizado_por = $9,
      actualizado_en = NOW()
    WHERE id = $10
    RETURNING *`,
    [
      proveedor_id,
      compra_id,
      monto_total,
      monto_pagado,
      fecha_emision,
      fecha_vencimiento,
      estado,
      notas,
      actualizado_por,
      id,
    ]
  );
  return result.rows[0];
}

export async function eliminarCuentaPorPagar(id) {
  await db.query(`DELETE FROM cuentas_por_pagar WHERE id = $1`, [id]);
}
