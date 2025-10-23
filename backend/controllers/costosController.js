import { supabase } from '../config/supabase.js';

import {
  determinarEstadoVigencia,
  calcularDiasVigente,
  calcularEstadisticasHistorial,
} from '../utils/helpersCostos.js';

function validarDatosCosto(datos, esCreacion = true) {
  const errores = [];

  if (esCreacion && !datos.producto_servicio_id) {
    errores.push('Debe especificar el producto o servicio');
  }

  if (datos.costo_unitario !== undefined) {
    const costo = parseFloat(datos.costo_unitario);
    if (isNaN(costo) || costo <= 0) {
      errores.push('El costo unitario debe ser un número mayor a cero');
    }
  }

  if (
    datos.precio_venta !== undefined &&
    datos.precio_venta !== null &&
    datos.precio_venta !== ''
  ) {
    const precio = parseFloat(datos.precio_venta);
    const costo = parseFloat(datos.costo_unitario);
    if (isNaN(precio) || precio <= 0) {
      errores.push('El precio de venta debe ser un número mayor a cero');
    }
    if (!isNaN(precio) && !isNaN(costo) && precio <= costo) {
      errores.push('El precio de venta debe ser mayor al costo unitario');
    }
  }

  if (datos.tipo_costo && !['fijo', 'variable'].includes(datos.tipo_costo)) {
    errores.push('El tipo de costo debe ser "fijo" o "variable"');
  }

  if (esCreacion && !datos.fecha_vigencia) {
    errores.push('Debe especificar la fecha de vigencia');
  }

  if (datos.fecha_vencimiento && datos.fecha_vigencia) {
    if (new Date(datos.fecha_vencimiento) <= new Date(datos.fecha_vigencia)) {
      errores.push(
        'La fecha de vencimiento debe ser posterior a la fecha de vigencia'
      );
    }
  }

  return errores;
}

// Registrar nuevo costo
export async function registrarCosto(req, res) {
  try {
    const {
      producto_servicio_id,
      costo_unitario,
      precio_venta,
      tipo_costo,
      fecha_vigencia,
      fecha_vencimiento,
      moneda = 'DOP',
      observaciones,
    } = req.body;

    // Validaciones
    const errores = validarDatosCosto(req.body);
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errores,
      });
    }

    // Verificar que el producto existe
    const { data: producto, error: productoError } = await supabase
      .from('productos_servicios')
      .select('nombre, tipo')
      .eq('id', producto_servicio_id)
      .single();

    if (productoError || !producto) {
      return res.status(404).json({
        error: 'Producto/servicio no encontrado',
      });
    }

    // Cerrar costo anterior (si existe uno vigente)
    const { error: cerrarError } = await supabase
      .from('costos')
      .update({
        fecha_vencimiento: fecha_vigencia,
        actualizado_en: new Date().toISOString(),
      })
      .eq('producto_servicio_id', producto_servicio_id)
      .is('fecha_vencimiento', null)
      .eq('eliminado', false);

    if (cerrarError) {
      console.error('Error cerrando costo anterior:', cerrarError);
    }

    // Insertar nuevo costo
    const { data, error } = await supabase
      .from('costos')
      .insert([
        {
          producto_servicio_id,
          costo_unitario: parseFloat(costo_unitario),
          precio_venta: precio_venta ? parseFloat(precio_venta) : null,
          tipo_costo,
          fecha_vigencia,
          fecha_vencimiento: fecha_vencimiento || null,
          moneda,
          observaciones,
          creado_por: req.user.id,
        },
      ])
      .select(
        `
        *,
        productos_servicios (
          codigo,
          nombre,
          tipo
        )
      `
      )
      .single();

    if (error) {
      console.error('Error insertando costo:', error);
      throw error;
    }

    console.log('✅ Costo registrado:', data.id);
    res.json({
      message: `Costo registrado exitosamente para ${producto.nombre}`,
      data: {
        ...data,
        margen_porcentaje: data.precio_venta
          ? (
              ((data.precio_venta - data.costo_unitario) / data.precio_venta) *
              100
            ).toFixed(2)
          : null,
      },
    });
  } catch (error) {
    console.error('❌ Error registrando costo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message,
    });
  }
}

// Consultar costos con filtros avanzados
export async function consultarCostos(req, res) {
  try {
    const {
      producto_id,
      categoria_id,
      tipo_costo,
      fecha_desde,
      fecha_hasta,
      solo_vigentes = 'true',
      buscar,
      page = 1,
      limit = 20,
    } = req.query;

    let query = supabase
      .from('costos')
      .select(
        `
        *,
        productos_servicios (
          codigo,
          nombre,
          tipo,
          categorias (
            nombre
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('eliminado', false)
      .order('fecha_vigencia', { ascending: false });

    // Aplicar filtros
    if (producto_id) {
      query = query.eq('producto_servicio_id', producto_id);
    }

    if (tipo_costo && tipo_costo !== 'todos') {
      query = query.eq('tipo_costo', tipo_costo);
    }

    if (fecha_desde) {
      query = query.gte('fecha_vigencia', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_vigencia', fecha_hasta);
    }

    if (solo_vigentes === 'true') {
      const hoy = new Date().toISOString().split('T')[0];
      query = query
        .lte('fecha_vigencia', hoy)
        .or(`fecha_vencimiento.is.null,fecha_vencimiento.gt.${hoy}`);
    }

    // Búsqueda por texto
    if (buscar) {
      query = query.or(
        `productos_servicios.nombre.ilike.%${buscar}%,productos_servicios.codigo.ilike.%${buscar}%`
      );
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Procesar datos para incluir cálculos
    const datosConCalculos = data.map((costo) => ({
      ...costo,
      margen_porcentaje: costo.precio_venta
        ? (
            ((costo.precio_venta - costo.costo_unitario) / costo.precio_venta) *
            100
          ).toFixed(2)
        : null,
      estado_vigencia: determinarEstadoVigencia(
        costo.fecha_vigencia,
        costo.fecha_vencimiento
      ),
      dias_vigente: calcularDiasVigente(
        costo.fecha_vigencia,
        costo.fecha_vencimiento
      ),
    }));

    res.json({
      data: datosConCalculos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
      filtros_aplicados: {
        producto_id,
        tipo_costo,
        fecha_desde,
        fecha_hasta,
        solo_vigentes: solo_vigentes === 'true',
        buscar,
      },
    });
  } catch (error) {
    console.error('❌ Error consultando costos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Obtener historial de costos de un producto
export async function historialCostosProducto(req, res) {
  try {
    const { producto_id } = req.params;

    const { data, error } = await supabase
      .from('costos')
      .select(
        `
        *,
        productos_servicios (
          codigo,
          nombre,
          tipo
        )
      `
      )
      .eq('producto_servicio_id', producto_id)
      .eq('eliminado', false)
      .order('fecha_vigencia', { ascending: false });

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron costos para este producto',
      });
    }

    // Calcular estadísticas
    const estadisticas = calcularEstadisticasHistorial(data);

    res.json({
      data: data.map((costo) => ({
        ...costo,
        margen_porcentaje: costo.precio_venta
          ? (
              ((costo.precio_venta - costo.costo_unitario) /
                costo.precio_venta) *
              100
            ).toFixed(2)
          : null,
        estado_vigencia: determinarEstadoVigencia(
          costo.fecha_vigencia,
          costo.fecha_vencimiento
        ),
      })),
      estadisticas,
      producto: data[0].productos_servicios,
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Actualizar costo existente
export async function actualizarCosto(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Validaciones
    const errores = validarDatosCosto(updateData, false);
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errores,
      });
    }

    // Remover campos que no se deben actualizar
    delete updateData.id;
    delete updateData.creado_por;
    delete updateData.creado_en;
    delete updateData.producto_servicio_id;

    // Convertir números
    if (updateData.costo_unitario) {
      updateData.costo_unitario = parseFloat(updateData.costo_unitario);
    }
    if (updateData.precio_venta) {
      updateData.precio_venta = parseFloat(updateData.precio_venta);
    }

    const { data, error } = await supabase
      .from('costos')
      .update(updateData)
      .eq('id', id)
      .eq('eliminado', false)
      .select(
        `
        *,
        productos_servicios (
          codigo,
          nombre,
          tipo
        )
      `
      )
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Costo no encontrado' });
    }

    console.log('✅ Costo actualizado:', id);
    res.json({
      message: 'Costo actualizado exitosamente',
      data: {
        ...data,
        margen_porcentaje: data.precio_venta
          ? (
              ((data.precio_venta - data.costo_unitario) / data.precio_venta) *
              100
            ).toFixed(2)
          : null,
      },
    });
  } catch (error) {
    console.error('❌ Error actualizando costo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Eliminar costo (soft delete)
export async function eliminarCosto(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('costos')
      .update({
        eliminado: true,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('eliminado', false)
      .select(
        `
        *,
        productos_servicios (
          nombre
        )
      `
      )
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Costo no encontrado' });
    }

    console.log('✅ Costo eliminado:', id);
    res.json({
      message: `Costo eliminado exitosamente para ${data.productos_servicios.nombre}`,
      data: { id: data.id },
    });
  } catch (error) {
    console.error('❌ Error eliminando costo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
