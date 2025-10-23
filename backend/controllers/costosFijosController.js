import { supabase } from '../config/supabase.js';

import {
  determinarEstadoVigenciaCostoFijo,
  calcularImpactoMensual,
} from '../utils/helpersCostos.js';

//! Registrar nuevo costo fijo

export async function registrarCostoFijo(req, res) {
  try {
    const {
      concepto,
      descripcion,
      monto,
      frecuencia,
      fecha_inicio,
      fecha_fin,
      categoria,
    } = req.body;

    // Validaciones
    if (!concepto || !monto || !frecuencia || !fecha_inicio) {
      return res.status(400).json({
        error:
          'Faltan campos obligatorios: concepto, monto, frecuencia, fecha_inicio',
      });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({
        error: 'El monto debe ser mayor a cero',
      });
    }

    const frecuenciasValidas = ['mensual', 'trimestral', 'semestral', 'anual'];
    if (!frecuenciasValidas.includes(frecuencia)) {
      return res.status(400).json({
        error:
          'Frecuencia inválida. Debe ser: ' + frecuenciasValidas.join(', '),
      });
    }

    const { data, error } = await supabase
      .from('costos_fijos')
      .insert([
        {
          concepto,
          descripcion,
          monto: parseFloat(monto),
          frecuencia,
          fecha_inicio,
          fecha_fin: fecha_fin || null,
          categoria,
          creado_por: req.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Costo fijo registrado:', data.id);
    res.json({
      message: 'Costo fijo registrado exitosamente',
      data: {
        ...data,
        impacto_mensual: calcularImpactoMensual(data.monto, data.frecuencia),
      },
    });
  } catch (error) {
    console.error('❌ Error registrando costo fijo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Consultar costos fijos
export async function consultarCostosFijos(req, res) {
  try {
    const {
      estado = 'activo',
      categoria,
      frecuencia,
      fecha_referencia,
      page = 1,
      limit = 20,
    } = req.query;

    let query = supabase
      .from('costos_fijos')
      .select('*', { count: 'exact' })
      .order('fecha_inicio', { ascending: false });

    // Filtros
    if (estado !== 'todos') {
      query = query.eq('estado', estado);
    }

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (frecuencia && frecuencia !== 'todas') {
      query = query.eq('frecuencia', frecuencia);
    }

    // Filtro por fecha (costos vigentes en una fecha específica)
    if (fecha_referencia) {
      query = query
        .lte('fecha_inicio', fecha_referencia)
        .or(`fecha_fin.is.null,fecha_fin.gte.${fecha_referencia}`);
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Calcular totales y estadísticas
    const datosConCalculos = data.map((costo) => ({
      ...costo,
      impacto_mensual: calcularImpactoMensual(costo.monto, costo.frecuencia),
      estado_vigencia: determinarEstadoVigenciaCostoFijo(
        costo.fecha_inicio,
        costo.fecha_fin
      ),
      dias_restantes: costo.fecha_fin
        ? Math.ceil(
            (new Date(costo.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24)
          )
        : null,
    }));

    const totalMensual = datosConCalculos
      .filter((c) => c.estado === 'activo' && c.estado_vigencia === 'vigente')
      .reduce((sum, c) => sum + parseFloat(c.impacto_mensual), 0);

    res.json({
      data: datosConCalculos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
      resumen: {
        total_mensual: totalMensual.toFixed(2),
        total_anual: (totalMensual * 12).toFixed(2),
        activos: datosConCalculos.filter((c) => c.estado === 'activo').length,
        vigentes: datosConCalculos.filter(
          (c) => c.estado_vigencia === 'vigente'
        ).length,
      },
    });
  } catch (error) {
    console.error('❌ Error consultando costos fijos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
