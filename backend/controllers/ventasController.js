import VentaModel from '../models/venta.model.js';

// ============= CONTROLADOR DE VENTAS MVC =============

/**
 * Obtener todas las ventas con filtros opcionales
 */
export const getVentas = async (req, res) => {
  try {
    const filtros = {
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin,
      forma_pago: req.query.forma_pago,
      cliente_id: req.query.cliente_id,
      estado: req.query.estado || 'activa',
    };

    const ventas = await VentaModel.findAll(filtros);
    res.json(ventas);
  } catch (error) {
    console.error('💥 Error al obtener ventas:', error);
    res.status(500).json({
      error: 'Error al obtener las ventas',
      details: error.message,
    });
  }
};

/**
 * Obtener una venta específica por ID
 */
export const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await VentaModel.findById(id);

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json(venta);
  } catch (error) {
    console.error('Error al obtener venta por ID:', error);
    res.status(500).json({
      error: 'Error al obtener la venta',
      details: error.message,
    });
  }
};

/**
 * Crear nueva venta con funcionalidades ERP
 */
export const createVenta = async (req, res) => {
  try {
    const ventaData = {
      cliente_id: req.body.cliente_id,
      monto: req.body.monto,
      usuario_id: req.body.usuario_id,
      descripcion: req.body.descripcion,
      fecha_venta: req.body.fecha_venta,
      tipo: req.body.tipo || 'manual',
      comprobante_fiscal: req.body.comprobante_fiscal || false,
      forma_pago: req.body.forma_pago || 'contado',
      cuenta_contable_id: req.body.cuenta_contable_id,
      // Campos ERP opcionales
      descuento: req.body.descuento || 0,
      itbis: req.body.itbis || 0,
      items: req.body.items || [],
    };

    // Validar datos usando el modelo
    const errores = VentaModel.validarDatosVenta(ventaData);
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errores,
      });
    }

    // Verificar que el cliente existe
    const clienteExiste = await VentaModel.clienteExiste(ventaData.cliente_id);
    if (!clienteExiste) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Crear la venta usando el modelo
    const resultado = await VentaModel.create(ventaData);

    console.log(
      `📝 Venta creada: ID ${resultado.venta_id}, Forma: ${resultado.forma_pago}, Monto: $${resultado.monto_total}`
    );

    res.status(201).json({
      message: `Venta ${resultado.forma_pago} registrada con movimientos contables`,
      ...resultado,
    });
  } catch (error) {
    console.error('💥 Error al crear venta:', error);
    res.status(500).json({
      error: 'Error al registrar la venta',
      details: error.message,
    });
  }
};

/**
 * Actualizar una venta existente
 */
export const updateVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = {
      cliente_id: req.body.cliente_id,
      monto: req.body.monto,
      usuario_id: req.body.usuario_id,
      descripcion: req.body.descripcion,
      fecha_venta: req.body.fecha_venta,
      tipo: req.body.tipo,
      comprobante_fiscal: req.body.comprobante_fiscal,
      forma_pago: req.body.forma_pago,
      cuenta_contable_id: req.body.cuenta_contable_id,
    };

    // Validar forma_pago si se proporciona
    if (
      datosActualizacion.forma_pago &&
      !['contado', 'credito'].includes(datosActualizacion.forma_pago)
    ) {
      return res.status(400).json({
        error: 'forma_pago debe ser "contado" o "credito"',
      });
    }

    const ventaActualizada = await VentaModel.update(id, datosActualizacion);

    if (!ventaActualizada) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({
      message: 'Venta actualizada exitosamente',
      venta: ventaActualizada,
    });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({
      error: 'Error al actualizar venta',
      details: error.message,
    });
  }
};

/**
 * Eliminar una venta completamente
 */
export const deleteVenta = async (req, res) => {
  try {
    const { id } = req.params;

    const ventaEliminada = await VentaModel.delete(id);

    res.json({
      message: 'Venta eliminada exitosamente',
      venta_eliminada: ventaEliminada,
    });
  } catch (error) {
    console.error('Error al eliminar venta:', error);

    if (error.message === 'Venta no encontrada') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Error al eliminar venta',
      details: error.message,
    });
  }
};

/**
 * Anular una venta (más profesional que eliminar)
 */
export const anularVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_anulacion, usuario_id } = req.body;

    if (!motivo_anulacion || !usuario_id) {
      return res.status(400).json({
        error: 'Se requieren motivo_anulacion y usuario_id',
      });
    }

    const ventaAnulada = await VentaModel.anular(
      id,
      motivo_anulacion,
      usuario_id
    );

    res.json({
      message: 'Venta anulada exitosamente',
      venta: ventaAnulada,
    });
  } catch (error) {
    console.error('Error al anular venta:', error);

    if (error.message === 'Venta no encontrada') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Error al anular venta',
      details: error.message,
    });
  }
};

/**
 * Generar reportes de ventas
 */
export const getReporteVentas = async (req, res) => {
  try {
    const filtros = {
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin,
      forma_pago: req.query.forma_pago,
      agrupado_por: req.query.agrupado_por || 'dia',
    };

    const reporte = await VentaModel.generarReporte(filtros);

    res.json({
      success: true,
      data: reporte,
      filtros_aplicados: filtros,
    });
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({
      error: 'Error al generar reporte de ventas',
      details: error.message,
    });
  }
};

// ============
