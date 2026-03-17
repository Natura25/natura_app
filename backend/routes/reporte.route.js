// routes/reporte.routes.js
// Rutas para reportes de nómina
import express from 'express';
import { verificarToken } from '../middlewares/auth.js';
import reporteNominaService from '../services/reporteNomina.service.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ============================================
// RUTAS DE REPORTES
// ============================================

/**
 * Reporte completo de nómina
 */
router.get('/nomina/:nomina_id', async (req, res) => {
  try {
    const { nomina_id } = req.params;
    const reporte = await reporteNominaService.generarReporteNomina(nomina_id);
    res.json(reporte);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Recibo individual de empleado
 */
router.get('/recibo/:detalle_nomina_id', async (req, res) => {
  try {
    const { detalle_nomina_id } = req.params;
    const recibo =
      await reporteNominaService.generarReciboIndividual(detalle_nomina_id);
    res.json(recibo);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reporte de costos mensuales
 */
router.get('/costos/:anio/:mes', async (req, res) => {
  try {
    const { anio, mes } = req.params;
    const reporte = await reporteNominaService.generarReporteCostos(
      parseInt(anio),
      parseInt(mes),
    );
    res.json(reporte);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reporte de deducciones por concepto
 */
router.get('/deducciones/:nomina_id', async (req, res) => {
  try {
    const { nomina_id } = req.params;
    const reporte =
      await reporteNominaService.generarReporteDeducciones(nomina_id);
    res.json(reporte);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reporte comparativo anual
 */
router.get('/comparativo/:anio', async (req, res) => {
  try {
    const { anio } = req.params;
    const reporte = await reporteNominaService.generarReporteComparativo(
      parseInt(anio),
    );
    res.json(reporte);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Archivo bancario para transferencias
 */
router.get('/archivo-bancario/:nomina_id', async (req, res) => {
  try {
    const { nomina_id } = req.params;
    const archivo =
      await reporteNominaService.generarArchivoBancario(nomina_id);
    res.json(archivo);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
