// controllers/empleadoController.js
// Controlador específico para gestión de empleados
import empleadoModel from '../models/empleado.model.js';
import configuracionSalarialModel from '../models/configuracionSalarial.model.js';

export default {
  /**
   * Listar empleados
   */
  async listar(req, res) {
    try {
      const filtros = {
        busqueda: req.query.busqueda,
        departamento_id: req.query.departamento_id,
        estado: req.query.estado,
        tipo_contrato: req.query.tipo_contrato,
        page: req.query.page,
        limit: req.query.limit,
      };

      const resultado = await empleadoModel.listarEmpleados(filtros);

      res.json({
        data: resultado.data,
        total: resultado.count,
        page: parseInt(filtros.page) || 1,
        limit: parseInt(filtros.limit) || 50,
      });
    } catch (error) {
      console.error('❌ Error en listar empleados:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener empleado por ID
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const empleado = await empleadoModel.obtenerEmpleadoPorId(id);

      if (!empleado) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      res.json(empleado);
    } catch (error) {
      console.error('❌ Error obteniendo empleado:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Crear empleado
   */
  async crear(req, res) {
    try {
      const userId = req.user?.id;
      const empleado = await empleadoModel.crearEmpleado(req.body, userId);

      res.status(201).json(empleado);
    } catch (error) {
      console.error('❌ Error creando empleado:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Actualizar empleado
   */
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const empleado = await empleadoModel.actualizarEmpleado(
        id,
        req.body,
        userId,
      );

      res.json(empleado);
    } catch (error) {
      console.error('❌ Error actualizando empleado:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Eliminar empleado (soft delete)
   */
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await empleadoModel.eliminarEmpleado(id, userId);

      res.json({ message: 'Empleado eliminado exitosamente' });
    } catch (error) {
      console.error('❌ Error eliminando empleado:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Configurar salario
   */
  async configurarSalario(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const configuracion = await configuracionSalarialModel.crearConfiguracion(
        {
          empleado_id: id,
          ...req.body,
        },
        userId,
      );

      res.status(201).json(configuracion);
    } catch (error) {
      console.error('❌ Error configurando salario:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Obtener historial de salarios
   */
  async obtenerHistorialSalario(req, res) {
    try {
      const { id } = req.params;
      const historial = await configuracionSalarialModel.obtenerHistorial(id);

      res.json(historial);
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener empleados activos con salario configurado
   */
  async obtenerParaNomina(req, res) {
    try {
      const empleados = await empleadoModel.obtenerEmpleadosParaNomina();
      res.json(empleados);
    } catch (error) {
      console.error('❌ Error obteniendo empleados para nómina:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Aplicar aumento masivo
   */
  async aplicarAumentoMasivo(req, res) {
    try {
      const { porcentaje, empleados_ids, motivo } = req.body;
      const userId = req.user?.id;

      if (!porcentaje || !empleados_ids || empleados_ids.length === 0) {
        return res.status(400).json({
          error: 'Porcentaje y empleados son requeridos',
        });
      }

      const resultados = await configuracionSalarialModel.aplicarAumentoMasivo(
        porcentaje,
        empleados_ids,
        motivo,
        userId,
      );

      res.json({
        message: 'Aumento aplicado exitosamente',
        resultados,
      });
    } catch (error) {
      console.error('❌ Error aplicando aumento masivo:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Buscar empleados por nombre o cédula
   */
  async buscar(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 3) {
        return res.status(400).json({
          error: 'La búsqueda debe tener al menos 3 caracteres',
        });
      }

      const resultado = await empleadoModel.listarEmpleados({
        busqueda: q,
        limit: 20,
      });

      res.json(resultado.data);
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Estadísticas de empleados
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { data: empleados } = await empleadoModel.listarEmpleados({
        limit: 10000,
      });

      const estadisticas = {
        total: empleados.length,
        activos: empleados.filter((e) => e.estado === 'activo').length,
        inactivos: empleados.filter((e) => e.estado === 'inactivo').length,
        por_contrato: {
          indefinido: empleados.filter((e) => e.tipo_contrato === 'indefinido')
            .length,
          temporal: empleados.filter((e) => e.tipo_contrato === 'temporal')
            .length,
          pasantia: empleados.filter((e) => e.tipo_contrato === 'pasantia')
            .length,
        },
        con_salario: empleados.filter(
          (e) =>
            e.configuracion_salarial && e.configuracion_salarial.length > 0,
        ).length,
        sin_salario: empleados.filter(
          (e) =>
            !e.configuracion_salarial || e.configuracion_salarial.length === 0,
        ).length,
      };

      res.json(estadisticas);
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
