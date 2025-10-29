// backend/controllers/cuentasContablesController.js - ACTUALIZADO

import cuentasContablesModel from '../models/cuentasContables.model.js';

export async function crear(req, res) {
  try {
    const cuenta = await cuentasContablesModel.crearCuentaContable(req.body);
    res.status(201).json(cuenta);
  } catch (err) {
    console.error('❌ Error en crear:', err);
    res
      .status(500)
      .json({ error: err.message || 'Error al crear cuenta contable' });
  }
}

export async function listar(req, res) {
  try {
    const { data, count } = await cuentasContablesModel.obtenerCuentasContables(
      req.query
    );

    // Enviar el header de conteo total
    res.set('X-Total-Count', count);

    // Retornar directamente el array de datos (no un objeto con data)
    res.json(data);
  } catch (err) {
    console.error('❌ Error en listar:', err);
    res
      .status(500)
      .json({ error: err.message || 'Error al obtener cuentas contables' });
  }
}

export async function ver(req, res) {
  try {
    const cuenta = await cuentasContablesModel.obtenerCuentaContablePorId(
      req.params.id
    );

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    res.json(cuenta);
  } catch (err) {
    console.error('❌ Error en ver:', err);
    res.status(500).json({ error: err.message || 'Error al obtener cuenta' });
  }
}

export async function editar(req, res) {
  try {
    const cuenta = await cuentasContablesModel.actualizarCuentaContable(
      req.params.id,
      req.body
    );

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    res.json(cuenta);
  } catch (err) {
    console.error('❌ Error en editar:', err);
    res
      .status(500)
      .json({ error: err.message || 'Error al actualizar cuenta' });
  }
}

export async function eliminar(req, res) {
  try {
    await cuentasContablesModel.desactivarCuentaContable(req.params.id);
    res.json({ message: 'Cuenta desactivada exitosamente' });
  } catch (err) {
    console.error('❌ Error en eliminar:', err);
    res.status(500).json({ error: err.message || 'Error al eliminar cuenta' });
  }
}

export async function activar(req, res) {
  try {
    await cuentasContablesModel.activarCuentaContable(req.params.id);
    res.json({ message: 'Cuenta activada exitosamente' });
  } catch (err) {
    console.error('❌ Error en activar:', err);
    res.status(500).json({ error: err.message || 'Error al activar cuenta' });
  }
}

export async function listarPorTipo(req, res) {
  try {
    const tipo = req.params.tipo;
    const cuentas = await cuentasContablesModel.obtenerCuentasContablesPorTipo(
      tipo
    );
    res.json(cuentas);
  } catch (err) {
    console.error('❌ Error en listarPorTipo:', err);
    res
      .status(500)
      .json({ error: err.message || 'Error al obtener cuentas por tipo' });
  }
}

export async function buscarPorCodigo(req, res) {
  try {
    const codigo = req.params.codigo;
    const cuenta = await cuentasContablesModel.buscarCuentaContablePorCodigo(
      codigo
    );

    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    res.json(cuenta);
  } catch (err) {
    console.error('❌ Error en buscarPorCodigo:', err);
    res
      .status(500)
      .json({ error: err.message || 'Error al buscar cuenta por código' });
  }
}

// Exportar default también para compatibilidad
export default {
  crear,
  listar,
  ver,
  editar,
  eliminar,
  activar,
  listarPorTipo,
  buscarPorCodigo,
};
