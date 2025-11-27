import { supabase } from '../config/supabase.js';
import { ProveedoresModel } from '../models/proveedores.model.js';

function validarDatosProveedor(datos, esCreacion = true) {
  const errores = [];

  if (esCreacion && !datos.nombre) {
    errores.push('El nombre del proveedor es requerido');
  }

  if (datos.nombre && datos.nombre.trim().length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres');
  }

  if (datos.email && datos.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datos.email)) {
      errores.push('El formato del email no es válido');
    }
  }

  if (datos.telefono && datos.telefono.trim() !== '') {
    const telefonoLimpio = datos.telefono.replace(/[\s\-()]/g, '');
    if (telefonoLimpio.length < 10) {
      errores.push('El teléfono debe tener al menos 10 dígitos');
    }
  }

  if (datos.rnc && datos.rnc.trim() !== '') {
    const rncLimpio = datos.rnc.replace(/[\s\-]/g, '');
    if (rncLimpio.length < 9 || rncLimpio.length > 11) {
      errores.push('El RNC debe tener entre 9 y 11 dígitos');
    }
  }

  return errores;
}

// Crear proveedor
export async function crearProveedor(req, res) {
  try {
    const { nombre, rnc, telefono, email, direccion } = req.body;

    // Validaciones
    const errores = validarDatosProveedor(req.body);
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errores,
      });
    }

    // Verificar si ya existe un proveedor con el mismo RNC usando el modelo
    if (rnc && rnc.trim() !== '') {
      const proveedorExistente = await ProveedoresModel.buscarPorRNC(
        rnc.trim()
      );

      if (proveedorExistente) {
        return res.status(409).json({
          error: 'Ya existe un proveedor con este RNC',
          proveedor: proveedorExistente,
        });
      }
    }

    // Verificar email duplicado
    if (email && email.trim() !== '') {
      const emailExistente = await ProveedoresModel.buscarPorEmail(
        email.trim()
      );

      if (emailExistente) {
        return res.status(409).json({
          error: 'Ya existe un proveedor con este email',
          proveedor: emailExistente,
        });
      }
    }

    // Crear proveedor usando el modelo
    const nuevoProveedor = await ProveedoresModel.crear({
      nombre: nombre.trim(),
      rnc: rnc ? rnc.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      email: email ? email.trim().toLowerCase() : null,
      direccion: direccion ? direccion.trim() : null,
    });

    console.log('✅ Proveedor creado:', nuevoProveedor.id);
    res.status(201).json({
      message: 'Proveedor creado exitosamente',
      data: nuevoProveedor,
    });
  } catch (error) {
    console.error('❌ Error creando proveedor:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message,
    });
  }
}

// Consultar proveedores con filtros
export async function consultarProveedores(req, res) {
  try {
    const { buscar, page = 1, limit = 20, ordenar = 'nombre' } = req.query;

    const resultado = await ProveedoresModel.consultar({
      buscar,
      page: parseInt(page),
      limit: parseInt(limit),
      ordenar,
    });

    res.json(resultado);
  } catch (error) {
    console.error('❌ Error consultando proveedores:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message,
    });
  }
}

// Obtener proveedor por ID
export async function obtenerProveedor(req, res) {
  try {
    const { id } = req.params;

    const proveedor = await ProveedoresModel.obtenerPorId(id);

    if (!proveedor) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      });
    }

    res.json({
      data: proveedor,
    });
  } catch (error) {
    console.error('❌ Error obteniendo proveedor:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message,
    });
  }
}

// Actualizar proveedor
export async function actualizarProveedor(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Validaciones
    const errores = validarDatosProveedor(updateData, false);
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errores,
      });
    }

    // Verificar si el proveedor existe
    const proveedorExistente = await ProveedoresModel.obtenerPorId(id);

    if (!proveedorExistente) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      });
    }

    // Verificar RNC duplicado si se está actualizando
    if (updateData.rnc && updateData.rnc.trim() !== '') {
      const rncDuplicado = await ProveedoresModel.buscarPorRNC(
        updateData.rnc.trim()
      );

      if (rncDuplicado && rncDuplicado.id !== parseInt(id)) {
        return res.status(409).json({
          error: 'Ya existe otro proveedor con este RNC',
          proveedor: rncDuplicado,
        });
      }
    }

    // Verificar email duplicado
    if (updateData.email && updateData.email.trim() !== '') {
      const emailDuplicado = await ProveedoresModel.buscarPorEmail(
        updateData.email.trim()
      );

      if (emailDuplicado && emailDuplicado.id !== parseInt(id)) {
        return res.status(409).json({
          error: 'Ya existe otro proveedor con este email',
          proveedor: emailDuplicado,
        });
      }
    }

    // Limpiar datos
    const datosLimpios = {};
    if (updateData.nombre) datosLimpios.nombre = updateData.nombre.trim();
    if (updateData.rnc) datosLimpios.rnc = updateData.rnc.trim();
    if (updateData.telefono) datosLimpios.telefono = updateData.telefono.trim();
    if (updateData.email)
      datosLimpios.email = updateData.email.trim().toLowerCase();
    if (updateData.direccion)
      datosLimpios.direccion = updateData.direccion.trim();

    // Actualizar usando el modelo
    const proveedorActualizado = await ProveedoresModel.actualizar(
      id,
      datosLimpios
    );

    console.log('✅ Proveedor actualizado:', id);
    res.json({
      message: 'Proveedor actualizado exitosamente',
      data: proveedorActualizado,
    });
  } catch (error) {
    console.error('❌ Error actualizando proveedor:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message,
    });
  }
}

// Eliminar proveedor
export async function eliminarProveedor(req, res) {
  try {
    const { id } = req.params;

    // Verificar si el proveedor tiene compras asociadas
    const tieneCompras = await ProveedoresModel.tieneCompras(id);

    if (tieneCompras) {
      return res.status(409).json({
        error: 'No se puede eliminar el proveedor',
        mensaje:
          'El proveedor tiene compras registradas. No se puede eliminar para mantener la integridad de los datos.',
      });
    }

    // Verificar si tiene inventario asociado
    const tieneInventario = await ProveedoresModel.tieneInventario(id);

    if (tieneInventario) {
      return res.status(409).json({
        error: 'No se puede eliminar el proveedor',
        mensaje:
          'El proveedor tiene productos en inventario asociados. No se puede eliminar para mantener la integridad de los datos.',
      });
    }

    // Eliminar proveedor usando el modelo
    const proveedorEliminado = await ProveedoresModel.eliminar(id);

    if (!proveedorEliminado) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      });
    }

    console.log('✅ Proveedor eliminado:', id);
    res.json({
      message: 'Proveedor eliminado exitosamente',
      data: { id: proveedorEliminado.id, nombre: proveedorEliminado.nombre },
    });
  } catch (error) {
    console.error('❌ Error eliminando proveedor:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message,
    });
  }
}

// Obtener historial de compras del proveedor
export async function historialComprasProveedor(req, res) {
  try {
    const { id } = req.params;
    const { fecha_desde, fecha_hasta, page = 1, limit = 10 } = req.query;

    // Verificar que el proveedor existe
    const proveedor = await ProveedoresModel.obtenerPorId(id);

    if (!proveedor) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      });
    }

    // Obtener historial usando el modelo
    const historial = await ProveedoresModel.obtenerHistorialCompras(id, {
      fecha_desde,
      fecha_hasta,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      proveedor: {
        id: proveedor.id,
        nombre: proveedor.nombre,
      },
      ...historial,
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial de compras:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message,
    });
  }
}
