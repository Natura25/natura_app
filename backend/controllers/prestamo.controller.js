// controllers/prestamoController.js
// Controlador para gestión de préstamos a empleados
import prestamoModel from '../models/prestamo.model.js';

export default {
  /**
   * Listar préstamos
   */
  async listar(req, res) {
    try {
      const filtros = {
        empleado_id: req.query.empleado_id,
        estado: req.query.estado,
        tipo: req.query.tipo,
        fecha_desde: req.query.fecha_desde,
        fecha_hasta: req.query.fecha_hasta,
        page: req.query.page,
        limit: req.query.limit,
      };

      const resultado = await prestamoModel.listarPrestamos(filtros);

      res.json({
        data: resultado.data,
        total: resultado.count,
        page: parseInt(filtros.page) || 1,
        limit: parseInt(filtros.limit) || 20,
      });
    } catch (error) {
      console.error('❌ Error listando préstamos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener préstamo por ID
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const prestamo = await prestamoModel.obtenerPrestamoPorId(id);

      if (!prestamo) {
        return res.status(404).json({ error: 'Préstamo no encontrado' });
      }

      res.json(prestamo);
    } catch (error) {
      console.error('❌ Error obteniendo préstamo:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Crear préstamo
   */
  async crear(req, res) {
    try {
      const userId = req.user?.id;
      const prestamo = await prestamoModel.crearPrestamo(req.body, userId);

      res.status(201).json(prestamo);
    } catch (error) {
      console.error('❌ Error creando préstamo:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Aprobar préstamo
   */
  async aprobar(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const prestamo = await prestamoModel.aprobarPrestamo(id, userId);

      res.json(prestamo);
    } catch (error) {
      console.error('❌ Error aprobando préstamo:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Rechazar préstamo
   */
  async rechazar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const userId = req.user?.id;

      const prestamo = await prestamoModel.rechazarPrestamo(id, motivo, userId);

      res.json(prestamo);
    } catch (error) {
      console.error('❌ Error rechazando préstamo:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Liquidar préstamo anticipadamente
   */
  async liquidar(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const prestamo = await prestamoModel.liquidarPrestamo(id, userId);

      res.json({
        message: 'Préstamo liquidado exitosamente',
        prestamo,
      });
    } catch (error) {
      console.error('❌ Error liquidando préstamo:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Obtener cuotas de un préstamo
   */
  async obtenerCuotas(req, res) {
    try {
      const { id } = req.params;
      const cuotas = await prestamoModel.obtenerCuotasPrestamo(id);

      res.json(cuotas);
    } catch (error) {
      console.error('❌ Error obteniendo cuotas:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener préstamos activos de un empleado
   */
  async obtenerActivosEmpleado(req, res) {
    try {
      const { empleado_id } = req.params;
      const prestamos =
        await prestamoModel.obtenerPrestamosActivos(empleado_id);

      res.json(prestamos);
    } catch (error) {
      console.error('❌ Error obteniendo préstamos activos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Calcular cuota de préstamo
   */
  async calcularCuota(req, res) {
    try {
      const { monto_total, numero_cuotas, tasa_interes } = req.body;

      if (!monto_total || !numero_cuotas) {
        return res.status(400).json({
          error: 'Monto y número de cuotas son requeridos',
        });
      }

      const tasaDecimal = (tasa_interes || 0) / 100;
      let montoCuota;

      if (tasaDecimal === 0) {
        // Sin interés
        montoCuota = monto_total / numero_cuotas;
      } else {
        // Con interés (fórmula de anualidades)
        const factor = Math.pow(1 + tasaDecimal, numero_cuotas);
        montoCuota = (monto_total * (tasaDecimal * factor)) / (factor - 1);
      }

      const totalAPagar = montoCuota * numero_cuotas;
      const totalInteres = totalAPagar - monto_total;

      res.json({
        monto_total,
        numero_cuotas,
        tasa_interes: tasa_interes || 0,
        monto_cuota: Math.round(montoCuota * 100) / 100,
        total_a_pagar: Math.round(totalAPagar * 100) / 100,
        total_interes: Math.round(totalInteres * 100) / 100,
      });
    } catch (error) {
      console.error('❌ Error calculando cuota:', error);
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Reporte de préstamos
   */
  async obtenerReporte(req, res) {
    try {
      const { fecha_desde, fecha_hasta, estado } = req.query;

      const filtros = {
        fecha_desde:
          fecha_desde ||
          new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        fecha_hasta: fecha_hasta || new Date().toISOString().split('T')[0],
        estado: estado || 'activo',
        limit: 10000,
      };

      const { data: prestamos } = await prestamoModel.listarPrestamos(filtros);

      const reporte = {
        total_prestamos: prestamos.length,
        monto_total_prestado: prestamos.reduce(
          (sum, p) => sum + Number(p.monto_total),
          0,
        ),
        monto_total_pendiente: prestamos.reduce(
          (sum, p) => sum + Number(p.saldo_pendiente),
          0,
        ),
        monto_total_pagado: prestamos.reduce(
          (sum, p) => sum + Number(p.monto_pagado),
          0,
        ),
        por_tipo: {},
        por_estado: {},
      };

      // Agrupar por tipo
      prestamos.forEach((p) => {
        reporte.por_tipo[p.tipo] = (reporte.por_tipo[p.tipo] || 0) + 1;
      });

      // Agrupar por estado
      prestamos.forEach((p) => {
        reporte.por_estado[p.estado] = (reporte.por_estado[p.estado] || 0) + 1;
      });

      res.json(reporte);
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
