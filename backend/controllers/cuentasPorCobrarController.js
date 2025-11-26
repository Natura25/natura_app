import { CuentaPorCobrar } from '../models/cuentasPorCobrar.model.js';

// Obtener todas las cuentas con filtros opcionales
// Filtros disponibles: ?estado=pendiente&cliente_id=5&fecha_desde=2024-01-01&fecha_hasta=2024-12-31
export const getAll = async (req, res) => {
  try {
    const filters = {
      estado: req.query.estado,
      cliente_id: req.query.cliente_id,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
    };

    // Remover filtros undefined
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    const cuentas = await CuentaPorCobrar.getAll(filters);
    res.json({
      success: true,
      data: cuentas,
      count: cuentas.length,
    });
  } catch (err) {
    console.error('Error al obtener cuentas por cobrar:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cuentas',
      message: err.message,
    });
  }
};

// Obtener una cuenta por ID con detalles completos
export const getById = async (req, res) => {
  try {
    const cuenta = await CuentaPorCobrar.getById(req.params.id);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta no encontrada',
      });
    }
    res.json({ success: true, data: cuenta });
  } catch (err) {
    console.error('Error al obtener cuenta por cobrar:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cuenta',
      message: err.message,
    });
  }
};

// Crear nueva cuenta por cobrar
export const createCuenta = async (req, res) => {
  try {
    const { cliente_id, monto_total, fecha_emision, fecha_vencimiento } =
      req.body;

    // Validaciones básicas
    if (!cliente_id || !monto_total || !fecha_emision || !fecha_vencimiento) {
      return res.status(400).json({
        success: false,
        error:
          'Faltan campos requeridos: cliente_id, monto_total, fecha_emision, fecha_vencimiento',
      });
    }

    if (parseFloat(monto_total) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El monto debe ser mayor a 0',
      });
    }

    const cuenta = await CuentaPorCobrar.createCuenta(req.body);
    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      data: cuenta,
    });
  } catch (err) {
    console.error('Error al crear cuenta por cobrar:', err);
    res.status(500).json({
      success: false,
      error: 'Error al crear cuenta',
      message: err.message,
    });
  }
};

// Actualizar cuenta por cobrar
export const updateCuenta = async (req, res) => {
  try {
    const cuenta = await CuentaPorCobrar.update(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Cuenta actualizada exitosamente',
      data: cuenta,
    });
  } catch (err) {
    console.error('Error al actualizar cuenta:', err);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar cuenta',
      message: err.message,
    });
  }
};

// Eliminar cuenta por cobrar
export const deleteCuenta = async (req, res) => {
  try {
    await CuentaPorCobrar.delete(req.params.id);
    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente',
    });
  } catch (err) {
    console.error('Error al eliminar cuenta:', err);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar cuenta',
      message: err.message,
    });
  }
};

// Registrar pago en una cuenta
// Body: { monto, metodo_pago, referencia, notas }
export const registrarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, metodo_pago, referencia, notas } = req.body;

    // Validaciones
    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El monto del pago debe ser mayor a 0',
      });
    }

    const cuenta = await CuentaPorCobrar.registrarPago(
      id,
      monto,
      metodo_pago || 'efectivo',
      referencia,
      notas
    );

    res.json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: cuenta,
    });
  } catch (err) {
    console.error('Error al registrar pago:', err);

    // Manejar error específico de sobrepago
    if (err.message.includes('excede el saldo')) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al registrar pago',
      message: err.message,
    });
  }
};

// Obtener dashboard con resumen de cuentas
// Query params opcionales: ?cliente_id=5
export const getDashboard = async (req, res) => {
  try {
    const { cliente_id } = req.query;
    const dashboard = await CuentaPorCobrar.getDashboard(cliente_id);
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (err) {
    console.error('Error al obtener dashboard:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener dashboard',
      message: err.message,
    });
  }
};

// Marcar cuentas vencidas (ejecutar con cron diariamente)
export const marcarVencidas = async (req, res) => {
  try {
    const cuentas = await CuentaPorCobrar.marcarVencidas();
    res.json({
      success: true,
      message: `${cuentas.length} cuenta(s) marcada(s) como vencida(s)`,
      data: cuentas,
    });
  } catch (err) {
    console.error('Error al marcar cuentas vencidas:', err);
    res.status(500).json({
      success: false,
      error: 'Error al marcar cuentas vencidas',
      message: err.message,
    });
  }
};

// Obtener historial de pagos de una cuenta
export const getHistorialPagos = async (req, res) => {
  try {
    const { id } = req.params;
    const pagos = await CuentaPorCobrar.getHistorialPagos(id);
    res.json({
      success: true,
      data: pagos,
      count: pagos.length,
    });
  } catch (err) {
    console.error('Error al obtener historial de pagos:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial',
      message: err.message,
    });
  }
};

// Obtener todas las cuentas de un cliente específico
export const getByCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const cuentas = await CuentaPorCobrar.getByCliente(cliente_id);
    res.json({
      success: true,
      data: cuentas,
      count: cuentas.length,
    });
  } catch (err) {
    console.error('Error al obtener cuentas del cliente:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cuentas',
      message: err.message,
    });
  }
};
