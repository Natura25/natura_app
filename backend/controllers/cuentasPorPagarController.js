import * as Modelo from '../models/cuentasPorPagar.model.js';

export async function crear(req, res) {
  try {
    const cuenta = await Modelo.crearCuentaPorPagar({
      ...req.body,
      creado_por: req.user.id, // del middleware de sesión
    });
    res.status(201).json(cuenta);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear cuenta por pagar' });
  }
}

export async function listar(req, res) {
  try {
    const cuentas = await Modelo.obtenerCuentasPorPagar();
    res.json(cuentas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuentas por pagar' });
  }
}

export async function ver(req, res) {
  try {
    const cuenta = await Modelo.obtenerCuentaPorPagarPorId(req.params.id);
    if (!cuenta)
      return res.status(404).json({ error: 'Cuenta por pagar no encontrada' });
    res.json(cuenta);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuenta por pagar' });
  }
}

export async function editar(req, res) {
  try {
    const cuenta = await Modelo.actualizarCuentaPorPagar(req.params.id, {
      ...req.body,
      actualizado_por: req.user.id,
    });
    res.json(cuenta);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cuenta por pagar' });
  }
}

export async function eliminar(req, res) {
  try {
    await Modelo.eliminarCuentaPorPagar(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cuenta por pagar' });
  }
}
