// controllers/clientesController.js - COMPLETO CON SUPABASE
const Cliente = require('../models/cliente.model');

class ClientesController {
  // ============= OBTENER TODOS =============
  static async obtenerTodos(req, res) {
    try {
      const filtros = {
        tipo_cliente: req.query.tipo_cliente,
        ciudad: req.query.ciudad,
        provincia: req.query.provincia,
      };

      console.log('📋 Obteniendo clientes con filtros:', filtros);

      const clientes = await Cliente.obtenerTodos(filtros);

      console.log(`✅ ${clientes.length} clientes obtenidos`);

      res.json(clientes);
    } catch (error) {
      console.error('❌ Error en obtenerTodos:', error);
      res.status(500).json({
        error: 'Error al obtener clientes',
        detalle: error.message,
      });
    }
  }

  // ============= OBTENER POR ID =============
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      console.log(`🔍 Obteniendo cliente ID: ${id}`);

      const cliente = await Cliente.obtenerPorId(id);

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      console.log(`✅ Cliente encontrado: ${cliente.nombre}`);

      res.json(cliente);
    } catch (error) {
      console.error('❌ Error en obtenerPorId:', error);
      res.status(500).json({
        error: 'Error al obtener cliente',
        detalle: error.message,
      });
    }
  }

  // ============= BUSCAR =============
  static async buscar(req, res) {
    try {
      const criterios = {
        cedula: req.query.cedula,
        rnc: req.query.rnc,
        nombre: req.query.nombre,
        telefono: req.query.telefono,
        email: req.query.email,
        tipo_cliente: req.query.tipo_cliente,
        ciudad: req.query.ciudad,
      };

      console.log('🔎 Buscando clientes con criterios:', criterios);

      const clientes = await Cliente.buscar(criterios);

      console.log(`✅ ${clientes.length} clientes encontrados`);

      res.json(clientes);
    } catch (error) {
      console.error('❌ Error en buscar:', error);
      res.status(500).json({
        error: 'Error al buscar clientes',
        detalle: error.message,
      });
    }
  }

  // ============= CREAR =============
  static async crear(req, res) {
    try {
      const clienteData = req.body;
      console.log('➕ Creando nuevo cliente:', clienteData.nombre);

      // Validaciones básicas
      if (!clienteData.nombre || clienteData.nombre.trim() === '') {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }

      // Validar tipo de cliente
      const tiposValidos = [
        'minorista',
        'mayorista',
        'distribuidor',
        'corporativo',
      ];
      if (
        clienteData.tipo_cliente &&
        !tiposValidos.includes(clienteData.tipo_cliente)
      ) {
        return res.status(400).json({
          error: 'Tipo de cliente inválido',
          tipos_validos: tiposValidos,
        });
      }

      // Validar límite de crédito y descuento
      if (clienteData.limite_credito && clienteData.limite_credito < 0) {
        return res
          .status(400)
          .json({ error: 'El límite de crédito debe ser mayor o igual a 0' });
      }

      if (
        clienteData.descuento_aplicable &&
        (clienteData.descuento_aplicable < 0 ||
          clienteData.descuento_aplicable > 100)
      ) {
        return res
          .status(400)
          .json({ error: 'El descuento debe estar entre 0 y 100' });
      }

      const cliente = await Cliente.crear(clienteData);

      console.log(`✅ Cliente creado con ID: ${cliente.id}`);

      res.status(201).json({
        mensaje: 'Cliente creado exitosamente',
        cliente,
      });
    } catch (error) {
      console.error('❌ Error en crear:', error);

      if (error.message.includes('Ya existe')) {
        return res.status(409).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'Error al crear cliente',
        detalle: error.message,
      });
    }
  }

  // ============= ACTUALIZAR =============
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const clienteData = req.body;
      console.log(`✏️ Actualizando cliente ID: ${id}`);

      // Validaciones
      if (clienteData.limite_credito && clienteData.limite_credito < 0) {
        return res
          .status(400)
          .json({ error: 'El límite de crédito debe ser mayor o igual a 0' });
      }

      if (
        clienteData.descuento_aplicable &&
        (clienteData.descuento_aplicable < 0 ||
          clienteData.descuento_aplicable > 100)
      ) {
        return res
          .status(400)
          .json({ error: 'El descuento debe estar entre 0 y 100' });
      }

      const cliente = await Cliente.actualizar(id, clienteData);

      console.log(`✅ Cliente actualizado: ${cliente.nombre}`);

      res.json({
        mensaje: 'Cliente actualizado exitosamente',
        cliente,
      });
    } catch (error) {
      console.error('❌ Error en actualizar:', error);

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('Ya existe')) {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({
        error: 'Error al actualizar cliente',
        detalle: error.message,
      });
    }
  }

  // ============= ELIMINAR =============
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Eliminando cliente ID: ${id}`);

      const resultado = await Cliente.eliminar(id);

      console.log(`✅ Cliente eliminado correctamente`);

      res.json(resultado);
    } catch (error) {
      console.error('❌ Error en eliminar:', error);

      if (error.message.includes('no se puede eliminar')) {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({
        error: 'Error al eliminar cliente',
        detalle: error.message,
      });
    }
  }

  // ============= ESTADÍSTICAS =============
  static async obtenerEstadisticas(req, res) {
    try {
      console.log('📊 Obteniendo estadísticas de clientes...');

      const stats = await Cliente.obtenerEstadisticas();

      console.log('✅ Estadísticas obtenidas');

      res.json(stats);
    } catch (error) {
      console.error('❌ Error en obtenerEstadisticas:', error);
      res.status(500).json({
        error: 'Error al obtener estadísticas',
        detalle: error.message,
      });
    }
  }

  // ============= TOP CLIENTES =============
  static async obtenerTopClientes(req, res) {
    try {
      const limite = parseInt(req.query.limite) || 10;
      console.log(`🏆 Obteniendo top ${limite} clientes...`);

      const clientes = await Cliente.obtenerTopClientes(limite);

      console.log(`✅ Top ${clientes.length} clientes obtenidos`);

      res.json(clientes);
    } catch (error) {
      console.error('❌ Error en obtenerTopClientes:', error);
      res.status(500).json({
        error: 'Error al obtener top clientes',
        detalle: error.message,
      });
    }
  }

  // ============= CLIENTES CON DEUDA =============
  static async obtenerClientesConDeuda(req, res) {
    try {
      console.log('💰 Obteniendo clientes con deuda...');

      const clientes = await Cliente.obtenerClientesConDeuda();

      const totalDeuda = clientes.reduce((sum, c) => sum + c.total_deuda, 0);

      console.log(
        `✅ ${clientes.length} clientes con deuda (Total: $${totalDeuda.toFixed(
          2
        )})`
      );

      res.json({
        clientes,
        resumen: {
          total_clientes_con_deuda: clientes.length,
          monto_total_deuda: parseFloat(totalDeuda.toFixed(2)),
        },
      });
    } catch (error) {
      console.error('❌ Error en obtenerClientesConDeuda:', error);
      res.status(500).json({
        error: 'Error al obtener clientes con deuda',
        detalle: error.message,
      });
    }
  }
}

module.exports = ClientesController;
