// backend/services/movimientosService.js
import db from '../schemas/db.js';

export async function registrarMovimientoContable({
  cuenta_id,
  origen_tabla,
  origen_id,
  descripcion,
  debe = 0,
  haber = 0,
  creado_por,
}) {
  try {
    await db.query(
      `INSERT INTO movimientos_contables 
        (cuenta_id, origen_tabla, origen_id, descripcion, debe, haber, creado_por) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [cuenta_id, origen_tabla, origen_id, descripcion, debe, haber, creado_por]
    );
  } catch (error) {
    console.error('Error registrando movimiento contable:', error);
    throw error;
  }
}
