// backend/controllers/ventasController.js - VERSIÓN CORREGIDA

import VentaModel from '../models/venta.model.js';

/**
 * Obtener todas las ventas con filtros opcionales
 */
export const getVentas = async (req, res) => {
  try {
    console.log('📋 Obteniendo ventas con filtros:', req.query);
    console.log('👤 Usuario:', req.user.email);

    const filtros = {
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin,
      forma_pago: req.query.forma_pago,
      cliente_id: req.query.cliente_id
        ? parseInt(req.query.cliente_id)
        : undefined,
    };

    const ventas = await VentaModel.findAll(filtros);

    console.log(`✅ ${ventas.length} ventas obtenidas`);

    res.set('X-Total-Count', ventas.length);
    res.json(ventas);
  } catch (error) {
    console.error('❌ Error al obtener ventas:', error);
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
    console.log('🔍 Buscando venta:', id);

    const venta = await VentaModel.findById(id);

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json(venta);
  } catch (error) {
    console.error('❌ Error al obtener venta por ID:', error);
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
    console.log('➕ Creando venta:', req.body);
    console.log('👤 Usuario autenticado:', {
      auth_id: req.user.id,
      email: req.user.email,
      username: req.user.username,
    });

    // ✅ CORRECCIÓN: Usar auth_id del middleware
    const ventaData = {
      cliente_id: parseInt(req.body.cliente_id), // Asegurar que sea integer
      monto: parseFloat(req.body.monto), // Asegurar que sea número
      auth_id: req.user.id, // ⚠️ CRÍTICO: Este es el UUID de auth.users
      descripcion: req.body.descripcion,
      fecha_venta: req.body.fecha_venta,
      tipo: req.body.tipo || 'manual',
      comprobante_fiscal: req.body.comprobante_fiscal || false,
      forma_pago: req.body.forma_pago || 'contado',
      cuenta_contable_id: req.body.cuenta_contable_id,
      descuento: parseFloat(req.body.descuento) || 0,
      itbis: parseFloat(req.body.itbis) || 0,
      items: req.body.items || [],
    };

    console.log('📝 Datos procesados para venta:', {
      cliente_id: ventaData.cliente_id,
      auth_id: ventaData.auth_id,
      monto: ventaData.monto,
      forma_pago: ventaData.forma_pago,
      items_count: ventaData.items.length,
    });

    // Validar datos
    const errores = VentaModel.validarDatosVenta(ventaData);
    if (errores.length > 0) {
      console.error('❌ Validación fallida:', errores);
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errores,
      });
    }

    // Verificar que el cliente existe
    const clienteExiste = await VentaModel.clienteExiste(ventaData.cliente_id);
    if (!clienteExiste) {
      console.error('❌ Cliente no encontrado:', ventaData.cliente_id);
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Crear la venta
    const resultado = await VentaModel.create(ventaData);

    console.log(
      `✅ Venta creada exitosamente: ID ${resultado.venta_id}, Forma: ${resultado.forma_pago}, Monto: $${resultado.monto_total}`
    );

    res.status(201).json({
      message: `Venta ${resultado.forma_pago} registrada exitosamente`,
      success: true,
      ...resultado,
    });
  } catch (error) {
    console.error('❌ Error al crear venta:', error);
    console.error('📋 Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error al registrar la venta',
      details: error.message,
      code: error.code || 'UNKNOWN',
    });
  }
};

/**
 * Actualizar una venta existente
 */
export const updateVenta = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✏️ Actualizando venta:', id);
    console.log('👤 Usuario:', req.user.email);

    const datosActualizacion = {
      cliente_id: req.body.cliente_id
        ? parseInt(req.body.cliente_id)
        : undefined,
      monto: req.body.monto ? parseFloat(req.body.monto) : undefined,
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

    console.log('✅ Venta actualizada:', id);

    res.json({
      message: 'Venta actualizada exitosamente',
      success: true,
      venta: ventaActualizada,
    });
  } catch (error) {
    console.error('❌ Error al actualizar venta:', error);
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
    console.log('🗑️ Eliminando venta:', id);
    console.log('👤 Usuario:', req.user.email);

    const ventaEliminada = await VentaModel.delete(id);

    console.log('✅ Venta eliminada:', id);

    res.json({
      message: 'Venta eliminada exitosamente',
      success: true,
      venta_eliminada: ventaEliminada,
    });
  } catch (error) {
    console.error('❌ Error al eliminar venta:', error);

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
 * Anular una venta (recomendado sobre eliminar)
 */
export const anularVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_anulacion } = req.body;
    const auth_id = req.user.id; // ✅ Usar auth_id

    console.log('❌ Anulando venta:', id);
    console.log('📝 Motivo:', motivo_anulacion);
    console.log('👤 Usuario:', req.user.email);

    if (!motivo_anulacion) {
      return res.status(400).json({
        error: 'Se requiere motivo_anulacion',
      });
    }

    const ventaAnulada = await VentaModel.anular(
      id,
      motivo_anulacion,
      auth_id // ✅ Pasar auth_id
    );

    console.log('✅ Venta anulada:', id);

    res.json({
      message: 'Venta anulada exitosamente',
      success: true,
      venta: ventaAnulada,
    });
  } catch (error) {
    console.error('❌ Error al anular venta:', error);

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
    console.log('📊 Generando reporte de ventas:', req.query);
    console.log('👤 Usuario:', req.user.email);

    const filtros = {
      fecha_inicio: req.query.fecha_inicio,
      fecha_fin: req.query.fecha_fin,
      forma_pago: req.query.forma_pago,
      agrupado_por: req.query.agrupado_por || 'dia',
    };

    const reporte = await VentaModel.generarReporte(filtros);

    console.log('✅ Reporte generado');

    res.json({
      success: true,
      data: reporte,
      filtros_aplicados: filtros,
    });
  } catch (error) {
    console.error('❌ Error al generar reporte de ventas:', error);
    res.status(500).json({
      error: 'Error al generar reporte de ventas',
      details: error.message,
    });
  }
};
