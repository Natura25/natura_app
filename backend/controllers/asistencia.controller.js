// controllers/asistenciaController.js
// Controlador para gestión de asistencias y control horario
import asistenciaModel from '../models/asistencia.model.js';

export default {
  /**
   * Listar asistencias
   */
  async listar(req, res) {
    try {
      const filtros = {
        empleado_id: req.query.empleado_id,
        fecha_desde: req.query.fecha_desde,
        fecha_hasta: req.query.fecha_hasta,
        estado: req.query.estado,
        turno: req.query.turno,
        page: req.query.page,
        limit: req.query.limit,
      };

      const resultado = await asistenciaModel.listarAsistencias(filtros);

      res.json({
        data: resultado.data,
        total: resultado.count,
        page: parseInt(filtros.page) || 1,
        limit: parseInt(filtros.limit) || 50,
      });
    } catch (error) {
      console.error('❌ Error listando asistencias:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Registrar entrada o salida
   */
  async registrar(req, res) {
    try {
      const userId = req.user?.id;
      const asistencia = await asistenciaModel.registrarAsistencia(
        req.body,
        userId,
      );

      res.status(201).json(asistencia);
    } catch (error) {
      console.error('❌ Error registrando asistencia:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Marcar ausencia/falta
   */
  async marcarAusencia(req, res) {
    try {
      const { empleado_id, fecha, motivo } = req.body;
      const userId = req.user?.id;

      if (!empleado_id || !fecha) {
        return res.status(400).json({
          error: 'Empleado y fecha son requeridos',
        });
      }

      const ausencia = await asistenciaModel.marcarAusencia(
        empleado_id,
        fecha,
        motivo,
        userId,
      );

      res.status(201).json(ausencia);
    } catch (error) {
      console.error('❌ Error marcando ausencia:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Justificar ausencia
   */
  async justificar(req, res) {
    try {
      const { id } = req.params;
      const { motivo, ausencia_id } = req.body;
      const userId = req.user?.id;

      const asistencia = await asistenciaModel.justificarAusencia(
        id,
        motivo,
        ausencia_id,
        userId,
      );

      res.json(asistencia);
    } catch (error) {
      console.error('❌ Error justificando ausencia:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Obtener resumen de asistencias
   */
  async obtenerResumen(req, res) {
    try {
      const { empleado_id } = req.params;
      const { fecha_inicio, fecha_fin } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          error: 'Fecha inicio y fin son requeridas',
        });
      }

      const resumen = await asistenciaModel.obtenerResumen(
        empleado_id,
        fecha_inicio,
        fecha_fin,
      );

      res.json(resumen);
    } catch (error) {
      console.error('❌ Error obteniendo resumen:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener horas extras para nómina
   */
  async obtenerHorasExtras(req, res) {
    try {
      const { empleado_id } = req.params;
      const { fecha_inicio, fecha_fin } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          error: 'Fecha inicio y fin son requeridas',
        });
      }

      const horasExtras = await asistenciaModel.obtenerHorasExtrasParaNomina(
        empleado_id,
        fecha_inicio,
        fecha_fin,
      );

      res.json({
        empleado_id,
        fecha_inicio,
        fecha_fin,
        horas_extras: horasExtras,
      });
    } catch (error) {
      console.error('❌ Error obteniendo horas extras:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Reporte de asistencias por departamento
   */
  async reportePorDepartamento(req, res) {
    try {
      const { departamento_id } = req.params;
      const { fecha_inicio, fecha_fin } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          error: 'Fecha inicio y fin son requeridas',
        });
      }

      const asistencias = await asistenciaModel.reportePorDepartamento(
        departamento_id,
        fecha_inicio,
        fecha_fin,
      );

      // Calcular estadísticas
      const resumen = {
        departamento_id,
        fecha_inicio,
        fecha_fin,
        total_registros: asistencias.length,
        presentes: asistencias.filter((a) => a.estado === 'presente').length,
        tardanzas: asistencias.filter((a) => a.estado === 'tardanza').length,
        faltas: asistencias.filter((a) => a.estado === 'falta').length,
        total_horas_extras: asistencias.reduce(
          (sum, a) => sum + (parseFloat(a.horas_extras) || 0),
          0,
        ),
      };

      res.json({
        resumen,
        asistencias,
      });
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Registrar entrada desde app móvil
   */
  async registrarEntradaMovil(req, res) {
    try {
      const { empleado_id, latitud, longitud } = req.body;
      const userId = req.user?.id;

      if (!empleado_id) {
        return res.status(400).json({ error: 'Empleado requerido' });
      }

      const asistencia = await asistenciaModel.registrarEntrada(
        {
          empleado_id,
          latitud,
          longitud,
          dispositivo: req.headers['user-agent'] || 'mobile',
        },
        userId,
      );

      res.status(201).json({
        message: 'Entrada registrada exitosamente',
        asistencia,
      });
    } catch (error) {
      console.error('❌ Error registrando entrada móvil:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Registrar salida desde app móvil
   */
  async registrarSalidaMovil(req, res) {
    try {
      const { asistencia_id, latitud, longitud } = req.body;
      const userId = req.user?.id;

      if (!asistencia_id) {
        return res.status(400).json({ error: 'ID de asistencia requerido' });
      }

      const asistencia = await asistenciaModel.registrarSalida(
        asistencia_id,
        {
          latitud,
          longitud,
          dispositivo: req.headers['user-agent'] || 'mobile',
        },
        userId,
      );

      res.json({
        message: 'Salida registrada exitosamente',
        asistencia,
      });
    } catch (error) {
      console.error('❌ Error registrando salida móvil:', error);
      res.status(400).json({ error: error.message });
    }
  },
};
