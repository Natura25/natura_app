// controllers/nominaController.js
// Controlador principal del módulo de nómina
import empleadoModel from '../models/empleado.model.js';
import conceptoModel from '../models/conceptoNomina.model.js';
import nominaModel from '../models/nomina.model.js';
import prestamoModel from '../models/prestamo.model.js';
import ausenciaModel from '../models/ausencia.model.js';

export default {
  // ============================================
  // EMPLEADOS
  // ============================================

  async listarEmpleados(req, res) {
    try {
      const { data, count } = await empleadoModel.listarEmpleados(req.query);
      res.set('X-Total-Count', count).json(data);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async obtenerEmpleado(req, res) {
    try {
      const empleado = await empleadoModel.obtenerEmpleadoPorId(req.params.id);
      if (!empleado) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      res.json(empleado);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async crearEmpleado(req, res) {
    try {
      const empleado = await empleadoModel.crearEmpleado(req.body, req.user.id);
      res.status(201).json(empleado);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async actualizarEmpleado(req, res) {
    try {
      const empleado = await empleadoModel.actualizarEmpleado(
        req.params.id,
        req.body,
        req.user.id,
      );
      res.json(empleado);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async eliminarEmpleado(req, res) {
    try {
      await empleadoModel.eliminarEmpleado(req.params.id, req.user.id);
      res.json({ message: 'Empleado eliminado exitosamente' });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async configurarSalario(req, res) {
    try {
      const config = await empleadoModel.configurarSalario(
        req.params.id,
        req.body,
        req.user.id,
      );
      res.json(config);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async obtenerEmpleadosParaNomina(req, res) {
    try {
      const empleados = await empleadoModel.obtenerEmpleadosParaNomina(
        req.query.departamento_id,
      );
      res.json(empleados);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ============================================
  // CONCEPTOS DE NÓMINA
  // ============================================

  async listarConceptos(req, res) {
    try {
      const { data, count } = await conceptoModel.listarConceptos(req.query);
      res.set('X-Total-Count', count).json(data);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async obtenerConcepto(req, res) {
    try {
      const concepto = await conceptoModel.obtenerConceptoPorId(req.params.id);
      if (!concepto) {
        return res.status(404).json({ error: 'Concepto no encontrado' });
      }
      res.json(concepto);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async crearConcepto(req, res) {
    try {
      const concepto = await conceptoModel.crearConcepto(req.body, req.user.id);
      res.status(201).json(concepto);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async actualizarConcepto(req, res) {
    try {
      const concepto = await conceptoModel.actualizarConcepto(
        req.params.id,
        req.body,
        req.user.id,
      );
      res.json(concepto);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async eliminarConcepto(req, res) {
    try {
      await conceptoModel.eliminarConcepto(req.params.id, req.user.id);
      res.json({ message: 'Concepto eliminado exitosamente' });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async obtenerPercepciones(req, res) {
    try {
      const percepciones = await conceptoModel.obtenerPercepciones();
      res.json(percepciones);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async obtenerDeducciones(req, res) {
    try {
      const deducciones = await conceptoModel.obtenerDeducciones();
      res.json(deducciones);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ============================================
  // NÓMINAS
  // ============================================

  async listarNominas(req, res) {
    try {
      const { data, count } = await nominaModel.listarNominas(req.query);
      res.set('X-Total-Count', count).json(data);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async obtenerNomina(req, res) {
    try {
      const nomina = await nominaModel.obtenerNominaPorId(req.params.id);
      if (!nomina) {
        return res.status(404).json({ error: 'Nómina no encontrada' });
      }
      res.json(nomina);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async obtenerDetalleNomina(req, res) {
    try {
      const detalle = await nominaModel.obtenerDetalleConMovimientos(
        req.params.id,
      );
      res.json(detalle);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async crearNomina(req, res) {
    try {
      const nomina = await nominaModel.crearNomina(req.body, req.user.id);
      res.status(201).json(nomina);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async calcularNomina(req, res) {
    try {
      const { empleados } = req.body;

      if (!empleados || empleados.length === 0) {
        return res
          .status(400)
          .json({ error: 'Debe incluir empleados para calcular' });
      }

      const nomina = await nominaModel.calcularNomina(
        req.params.id,
        empleados,
        req.user.id,
      );

      res.json({
        message: 'Nómina calculada exitosamente',
        nomina,
      });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async recalcularNomina(req, res) {
    try {
      const { empleados } = req.body;

      if (!empleados || empleados.length === 0) {
        return res
          .status(400)
          .json({ error: 'Debe incluir empleados para recalcular' });
      }

      const nomina = await nominaModel.recalcularNomina(
        req.params.id,
        empleados,
        req.user.id,
      );

      res.json({
        message: 'Nómina recalculada exitosamente',
        nomina,
      });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async aprobarNomina(req, res) {
    try {
      const nomina = await nominaModel.aprobarNomina(
        req.params.id,
        req.user.id,
      );
      res.json({
        message: 'Nómina aprobada exitosamente',
        nomina,
      });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async marcarComoPagada(req, res) {
    try {
      const nomina = await nominaModel.marcarComoPagada(
        req.params.id,
        req.user.id,
      );
      res.json({
        message: 'Nómina marcada como pagada',
        nomina,
      });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async eliminarNomina(req, res) {
    try {
      await nominaModel.eliminarNomina(req.params.id, req.user.id);
      res.json({ message: 'Nómina eliminada exitosamente' });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  // ============================================
  // PRÉSTAMOS
  // ============================================

  async listarPrestamos(req, res) {
    try {
      const { data, count } = await prestamoModel.listarPrestamos(req.query);
      res.set('X-Total-Count', count).json(data);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async crearPrestamo(req, res) {
    try {
      const prestamo = await prestamoModel.crearPrestamo(req.body, req.user.id);
      res.status(201).json(prestamo);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async aprobarPrestamo(req, res) {
    try {
      const prestamo = await prestamoModel.aprobarPrestamo(
        req.params.id,
        req.user.id,
      );
      res.json({
        message: 'Préstamo aprobado exitosamente',
        prestamo,
      });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  // ============================================
  // AUSENCIAS
  // ============================================

  async listarAusencias(req, res) {
    try {
      const { data, count } = await ausenciaModel.listarAusencias(req.query);
      res.set('X-Total-Count', count).json(data);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async crearAusencia(req, res) {
    try {
      const ausencia = await ausenciaModel.crearAusencia(req.body, req.user.id);
      res.status(201).json(ausencia);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async aprobarAusencia(req, res) {
    try {
      const ausencia = await ausenciaModel.aprobarAusencia(
        req.params.id,
        req.user.id,
      );
      res.json({
        message: 'Ausencia aprobada exitosamente',
        ausencia,
      });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async rechazarAusencia(req, res) {
    try {
      const { motivo } = req.body;
      const ausencia = await ausenciaModel.rechazarAusencia(
        req.params.id,
        motivo,
        req.user.id,
      );
      res.json({
        message: 'Ausencia rechazada',
        ausencia,
      });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(400).json({ error: error.message });
    }
  },
};
