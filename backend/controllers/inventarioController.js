// backend/controllers/inventarioController.js - VERSIÓN CORREGIDA

import inventarioModel from '../models/inventario.model.js';
import movimientoModel from '../models/movimientoInventario.model.js';
import {
  generarReporteInventario,
  generarReporteMovimientos,
} from '../services/reportGenerator.js';

export default {
  //! Obtener todos los productos (usa listarProductos del modelo)
  async obtenerProductos(req, res) {
    try {
      console.log('📦 Obteniendo productos con filtros:', req.query);
      const { data, count } = await inventarioModel.listarProductos(req.query);
      res.set('X-Total-Count', count).json(data);
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  //! Obtener un producto específico por ID
  async obtenerProductoPorId(req, res) {
    try {
      const producto = await inventarioModel.obtenerProductoPorId(
        req.params.id
      );

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json(producto);
    } catch (error) {
      console.error('❌ Error obteniendo producto:', error);
      res.status(500).json({ error: error.message });
    }
  },

  //! Crear producto
  async crearProducto(req, res) {
    try {
      console.log('➕ Creando producto:', req.body);
      const producto = await inventarioModel.crearProducto({
        ...req.body,
        creado_por: req.user.id,
        actualizado_por: req.user.id,
      });
      res.status(201).json(producto);
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      res.status(400).json({ error: error.message });
    }
  },

  //! Actualizar producto
  async actualizarProducto(req, res) {
    try {
      console.log('✏️ Actualizando producto:', req.params.id);
      const producto = await inventarioModel.actualizarProducto(req.params.id, {
        ...req.body,
        actualizado_por: req.user.id,
      });
      res.json(producto);
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      res.status(400).json({ error: error.message });
    }
  },

  //! Eliminar producto (soft delete)
  async eliminarProducto(req, res) {
    try {
      console.log('🗑️ Eliminando producto:', req.params.id);
      await inventarioModel.eliminarProducto(req.params.id);
      res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      res.status(400).json({ error: error.message });
    }
  },

  //! Registrar entrada de inventario
  async registrarEntrada(req, res) {
    try {
      console.log('📥 Registrando entrada:', req.body);
      const movimiento = await movimientoModel.registrarMovimiento({
        ...req.body,
        tipo: 'entrada',
        usuario_id: req.user.id,
      });

      await inventarioModel.actualizarStock(
        req.body.producto_id,
        req.body.cantidad,
        'entrada'
      );

      res.status(201).json(movimiento);
    } catch (error) {
      console.error('❌ Error registrando entrada:', error);
      res.status(400).json({ error: error.message });
    }
  },

  //! Registrar salida de inventario
  async registrarSalida(req, res) {
    try {
      console.log('📤 Registrando salida:', req.body);
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
      console.error('❌ Error registrando salida:', error);
      res.status(400).json({ error: error.message });
    }
  },

  //! Registrar ajuste de inventario
  async registrarAjuste(req, res) {
    try {
      console.log('⚙️ Registrando ajuste:', req.body);
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
      console.error('❌ Error registrando ajuste:', error);
      res.status(400).json({ error: error.message });
    }
  },

  //! Obtener movimientos
  async obtenerMovimientos(req, res) {
    try {
      console.log('📋 Obteniendo movimientos con filtros:', req.query);
      const { data, count } = await movimientoModel.obtenerMovimientos(
        req.query
      );
      res.set('X-Total-Count', count).json(data);
    } catch (error) {
      console.error('❌ Error obteniendo movimientos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  //! Generar reporte de inventario
  async reporteInventario(req, res) {
    try {
      console.log('📄 Generando reporte de inventario...');
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
        `attachment; filename=reporte-inventario-${Date.now()}.${
          formato === 'excel' ? 'xlsx' : 'pdf'
        }`
      );

      res.send(reporte);
    } catch (error) {
      console.error('❌ Error en reporteInventario:', error);
      res.status(500).json({ error: error.message });
    }
  },

  //! Generar reporte de movimientos
  async reporteMovimientos(req, res) {
    try {
      console.log('📄 Generando reporte de movimientos...');
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
        `attachment; filename=reporte-movimientos-${Date.now()}.${
          formato === 'excel' ? 'xlsx' : 'pdf'
        }`
      );

      res.send(reporte);
    } catch (error) {
      console.error('❌ Error en reporteMovimientos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  //! Obtener alertas de stock bajo
  async obtenerAlertasStock(req, res) {
    try {
      console.log('🔔 Obteniendo alertas de stock bajo...');
      const productos = await inventarioModel.obtenerProductosStockBajo();
      res.json(productos);
    } catch (error) {
      console.error('❌ Error obteniendo alertas:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
