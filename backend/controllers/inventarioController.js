import inventarioModel from '../models/inventario.model.js';
import movimientoModel from '../models/movimientoInventario.model.js';
import {
  generarReporteInventario,
  generarReporteMovimientos,
} from '../services/reportGenerator.js';

export default {
  //! Gestión de Productos
  async crearProducto(req, res) {
    try {
      const producto = await inventarioModel.crearProducto({
        ...req.body,
        creado_por: req.user.id,
        actualizado_por: req.user.id,
      });
      res.status(201).json(producto);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async actualizarProducto(req, res) {
    try {
      const producto = await inventarioModel.actualizarProducto(req.params.id, {
        ...req.body,
        actualizado_por: req.user.id,
      });
      res.json(producto);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async listarProductos(req, res) {
    try {
      const { data, count } = await inventarioModel.listarProductos(req.query);
      res.set('X-Total-Count', count).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  //! Movimientos de Inventario
  async registrarEntrada(req, res) {
    try {
      const movimiento = await movimientoModel.registrarMovimiento({
        ...req.body,
        tipo: 'entrada',
        usuario_id: req.user.id,
      });

      //! Actualizar stock
      await inventarioModel.actualizarStock(
        req.body.producto_id,
        req.body.cantidad,
        'entrada'
      );

      res.status(201).json(movimiento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async registrarSalida(req, res) {
    try {
      const movimiento = await movimientoModel.registrarMovimiento({
        ...req.body,
        tipo: 'salida',
        usuario_id: req.user.id,
      });

      await inventarioModel.actualizarStock(
        req.body.producto_id,
        -req.body.cantidad,
        'salida'
      );

      res.status(201).json(movimiento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async registrarAjuste(req, res) {
    try {
      const { producto_id, cantidad, motivo } = req.body;
      const tipo = cantidad >= 0 ? 'ajuste_entrada' : 'ajuste_salida';

      const movimiento = await movimientoModel.registrarMovimiento({
        producto_id,
        cantidad: Math.abs(cantidad),
        tipo,
        motivo,
        usuario_id: req.user.id,
      });

      await inventarioModel.actualizarStock(producto_id, cantidad, tipo);
      res.status(201).json(movimiento);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  //! Reportes
  async reporteInventario(req, res) {
    try {
      const { formato = 'pdf' } = req.query;
      const { data: productos } = await inventarioModel.listarProductos();

      const reporte = await generarReporteInventario(productos, formato);

      res.setHeader(
        'Content-Type',
        formato === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte-inventario-${Date.now()}.${formato}`
      );

      res.send(reporte);
    } catch (error) {
      console.error('❌ Error en reporteInventario:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async reporteMovimientos(req, res) {
    try {
      const { formato = 'pdf', ...filtros } = req.query;
      const { data: movimientos } = await movimientoModel.obtenerMovimientos(
        filtros
      );

      const reporte = await generarReporteMovimientos(movimientos, formato);

      res.setHeader(
        'Content-Type',
        formato === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte-movimientos-${Date.now()}.${formato}`
      );

      res.send(reporte);
    } catch (error) {
      console.error('❌ Error en reporteMovimiento:', error);
      res.status(500).json({ error: error.message });
    }
  },

  //! Alertas
  async obtenerAlertasStock(req, res) {
    try {
      const productos = await inventarioModel.obtenerProductosStockBajo();
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
