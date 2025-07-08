import db from '../schemas/db.js';

export async function crearCuentaContable({
  codigo,
  nombre,
  tipo,
  descripcion,
  padre_id = null,
}) {
  const result = await db.query(
    `INSERT INTO cuentas_contables (codigo, nombre, tipo, descripcion, padre_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [codigo, nombre, tipo, descripcion, padre_id]
  );
  return result.rows[0];
}

export async function obtenerCuentasContables() {
  const result = await db.query(
    `SELECT * FROM cuentas_contables WHERE activo = true ORDER BY codigo ASC`
  );
  return result.rows;
}

export async function obtenerCuentaContablePorId(id) {
  const result = await db.query(
    `SELECT * FROM cuentas_contables WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function actualizarCuentaContable(
  id,
  { codigo, nombre, tipo, descripcion, padre_id = null }
) {
  const result = await db.query(
    `UPDATE cuentas_contables
     SET codigo = $1, nombre = $2, tipo = $3, descripcion = $4, padre_id = $5, actualizado_en = NOW()
     WHERE id = $6 RETURNING *`,
    [codigo, nombre, tipo, descripcion, padre_id, id]
  );
  return result.rows[0];
}

export async function desactivarCuentaContable(id) {
  await db.query(
    `UPDATE cuentas_contables SET activo = false, actualizado_en = NOW() WHERE id = $1`,
    [id]
  );
}

export async function activarCuentaContable(id) {
  await db.query(
    `UPDATE cuentas_contables SET activo = true, actualizado_en = NOW() WHERE id = $1`,
    [id]
  );
}

export async function obtenerCuentasContablesPorTipo(tipo) {
  const result = await db.query(
    `SELECT * FROM cuentas_contables WHERE tipo = $1 AND activo = true ORDER BY codigo ASC`,
    [tipo]
  );
  return result.rows;
}

export async function buscarCuentaContablePorCodigo(codigo) {
  const result = await db.query(
    `SELECT * FROM cuentas_contables WHERE codigo = $1 AND activo = true`,
    [codigo]
  );
  return result.rows[0];
}
