import * as Modelo from '../models/cuentasContables.model.js';

export async function crear(req, res) {
  try {
    const cuenta = await Modelo.crearCuentaContable(req.body);
    res.status(201).json(cuenta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cuenta contable' });
  }
}

export async function listar(req, res) {
  try {
    const cuentas = await Modelo.obtenerCuentasContables();
    res.json(cuentas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuentas contables' });
  }
}

export async function ver(req, res) {
  try {
    const cuenta = await Modelo.obtenerCuentaContablePorId(req.params.id);
    if (!cuenta) return res.status(404).json({ error: 'No encontrada' });
    res.json(cuenta);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuenta' });
  }
}

export async function editar(req, res) {
  try {
    const cuenta = await Modelo.actualizarCuentaContable(
      req.params.id,
      req.body
    );
    res.json(cuenta);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cuenta' });
  }
}

export async function eliminar(req, res) {
  try {
    await Modelo.desactivarCuentaContable(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
}

export async function activar(req, res) {
  try {
    await Modelo.activarCuentaContable(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al activar cuenta' });
  }
}

export async function listarPorTipo(req, res) {
  try {
    const tipo = req.params.tipo;
    const cuentas = await Modelo.obtenerCuentasContablesPorTipo(tipo);
    res.json(cuentas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuentas por tipo' });
  }
}

export async function buscarPorCodigo(req, res) {
  try {
    const codigo = req.params.codigo;
    const cuenta = await Modelo.obtenerCuentaContablePorCodigo(codigo);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(cuenta);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar cuenta por código' });
  }
}
