import { CuentaPorCobrar } from '../models/cuentasPorCobrar.model.js';

export const getAll = async (req, res) => {
  try {
    const cuentas = await CuentaPorCobrar.getAll();
    res.json(cuentas);
  } catch (err) {
    console.error('Error al obtener cuentas por cobrar:', err);
    res.status(500).json({ error: 'Error al obtener cuentas' });
  }
};

export const getById = async (req, res) => {
  try {
    const cuenta = await CuentaPorCobrar.getById(req.params.id);
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(cuenta);
  } catch (err) {
    console.error('Error al obtener cuenta por cobrar:', err);
    res.status(500).json({ error: 'Error al obtener cuenta' });
  }
};

export const createCuenta = async (req, res) => {
  try {
    const cuenta = await CuentaPorCobrar.createCuenta(req.body);
    res.status(201).json({ message: 'Cuenta creada', cuenta });
  } catch (err) {
    console.error('Error al crear cuenta por cobrar:', err);
    res.status(500).json({ error: 'Error al crear cuenta' });
  }
};
