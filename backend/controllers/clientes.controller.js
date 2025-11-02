// backend/controllers/clientes.controller.js
import ClienteModel from '../models/cliente.model.js';

export default {
  /**
   * Obtener todos los clientes (con filtros opcionales)
   */
  async getClientes(req, res) {
    try {
      const filtros = {
        tipo_cliente: req.query.tipo_cliente,
        ciudad: req.query.ciudad,
        provincia: req.query.provincia,
      };

      console.log('📋 Obteniendo clientes con filtros:', filtros);

      const clientes = await ClienteModel.obtenerTodos(filtros);

      res.set('X-Total-Count', clientes.length);
      res.json(clientes);
    } catch (error) {
      console.error('❌ Error en getClientes:', error);
      res.status(500).json({
        error: 'Error al obtener clientes',
        detalle: error.message,
      });
    }
  },

  /**
   * Obtener cliente por ID
   */
  async getClienteById(req, res) {
    try {
      const { id } = req.params;
      console.log(`🔍 Buscando cliente ID: ${id}`);

      const cliente = await ClienteModel.obtenerPorId(id);

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json(cliente);
    } catch (error) {
      console.error('❌ Error en getClienteById:', error);
      res.status(500).json({
        error: 'Error al obtener cliente',
        detalle: error.message,
      });
    }
  },

  /**
   * Buscar clientes por criterios
   */
  async buscarClientes(req, res) {
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

      const clientes = await ClienteModel.buscar(criterios);
      res.json(clientes);
    } catch (error) {
      console.error('❌ Error en buscarClientes:', error);
      res.status(500).json({
        error: 'Error al buscar clientes',
        detalle: error.message,
      });
    }
  },

  /**
   * Crear nuevo cliente
   */
  async createCliente(req, res) {
    try {
      const data = req.body;
      console.log('➕ Creando cliente:', data.nombre);

      if (!data.nombre?.trim()) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }

      const tiposValidos = [
        'minorista',
        'mayorista',
        'distribuidor',
        'corporativo',
      ];
      if (data.tipo_cliente && !tiposValidos.includes(data.tipo_cliente)) {
        return res.status(400).json({
          error: 'Tipo de cliente inválido',
          tipos_validos: tiposValidos,
        });
      }

      if (data.limite_credito < 0) {
        return res
          .status(400)
          .json({ error: 'El límite de crédito debe ser mayor o igual a 0' });
      }

      if (
        data.descuento_aplicable &&
        (data.descuento_aplicable < 0 || data.descuento_aplicable > 100)
      ) {
        return res
          .status(400)
          .json({ error: 'El descuento debe estar entre 0 y 100' });
      }

      const nuevoCliente = await ClienteModel.crear(data);

      res.status(201).json({
        mensaje: 'Cliente creado exitosamente',
        cliente: nuevoCliente,
      });
    } catch (error) {
      console.error('❌ Error en createCliente:', error);
      res.status(500).json({
        error: 'Error al crear cliente',
        detalle: error.message,
      });
    }
  },

  /**
   * Actualizar cliente existente
   */
  async updateCliente(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      console.log(`✏️ Actualizando cliente ID: ${id}`);

      if (data.limite_credito && data.limite_credito < 0) {
        return res
          .status(400)
          .json({ error: 'El límite de crédito debe ser mayor o igual a 0' });
      }

      if (
        data.descuento_aplicable &&
        (data.descuento_aplicable < 0 || data.descuento_aplicable > 100)
      ) {
        return res
          .status(400)
          .json({ error: 'El descuento debe estar entre 0 y 100' });
      }

      const clienteActualizado = await ClienteModel.actualizar(id, data);

      if (!clienteActualizado) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json({
        mensaje: 'Cliente actualizado exitosamente',
        cliente: clienteActualizado,
      });
    } catch (error) {
      console.error('❌ Error en updateCliente:', error);
      res.status(500).json({
        error: 'Error al actualizar cliente',
        detalle: error.message,
      });
    }
  },

  /**
   * Eliminar cliente
   */
  async deleteCliente(req, res) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Eliminando cliente ID: ${id}`);

      const resultado = await ClienteModel.eliminar(id);

      res.json({
        mensaje: 'Cliente eliminado exitosamente',
        resultado,
      });
    } catch (error) {
      console.error('❌ Error en deleteCliente:', error);
      res.status(500).json({
        error: 'Error al eliminar cliente',
        detalle: error.message,
      });
    }
  },

  /**
   * Obtener estadísticas de clientes
   */
  async getEstadisticasClientes(req, res) {
    try {
      console.log('📊 Obteniendo estadísticas de clientes...');
      const stats = await ClienteModel.obtenerEstadisticas();
      res.json(stats);
    } catch (error) {
      console.error('❌ Error en getEstadisticasClientes:', error);
      res.status(500).json({
        error: 'Error al obtener estadísticas',
        detalle: error.message,
      });
    }
  },

  /**
   * Obtener top clientes
   */
  async getTopClientes(req, res) {
    try {
      const limite = parseInt(req.query.limite) || 10;
      console.log(`🏆 Obteniendo top ${limite} clientes...`);

      const clientes = await ClienteModel.obtenerTopClientes(limite);
      res.json(clientes);
    } catch (error) {
      console.error('❌ Error en getTopClientes:', error);
      res.status(500).json({
        error: 'Error al obtener top clientes',
        detalle: error.message,
      });
    }
  },

  /**
   * Obtener clientes con deuda
   */
  async getClientesConDeuda(req, res) {
    try {
      console.log('💰 Obteniendo clientes con deuda...');
      const clientes = await ClienteModel.obtenerClientesConDeuda();

      const totalDeuda = clientes.reduce((sum, c) => sum + c.total_deuda, 0);

      res.json({
        clientes,
        resumen: {
          total_clientes_con_deuda: clientes.length,
          monto_total_deuda: parseFloat(totalDeuda.toFixed(2)),
        },
      });
    } catch (error) {
      console.error('❌ Error en getClientesConDeuda:', error);
      res.status(500).json({
        error: 'Error al obtener clientes con deuda',
        detalle: error.message,
      });
    }
  },
};
