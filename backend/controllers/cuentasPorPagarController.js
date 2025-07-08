import { CuentaPorPagar } from '../models/cuentasPorPagar.model.js';

export const getAll = async (req, res) => {
  try {
    const cuentas = await CuentaPorPagar.getAll();
    res.json(cuentas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener cuentas por pagar' });
  }
};

export const getById = async (req, res) => {
  try {
    const cuenta = await CuentaPorPagar.getById(req.params.id);
    if (!cuenta) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.json(cuenta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener cuenta por ID' });
  }
};

export const createCuenta = async (req, res) => {
  try {
    const nuevaCuenta = await CuentaPorPagar.createCuenta(req.body);
    res.status(201).json(nuevaCuenta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cuenta por pagar' });
  }
};
