// src/services/ventasService.js - VERSIÓN FINAL

const API_URL =
  import.meta.env.VITE_API_URL || 'https://natura-app.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const ventasService = {
  // ============= VENTAS =============

  /**
   * Obtener todas las ventas con filtros opcionales
   */
  async obtenerVentas(filtros = {}) {
    try {
      const params = new URLSearchParams();

      // Agregar solo filtros definidos
      if (filtros.fecha_inicio)
        params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.forma_pago) params.append('forma_pago', filtros.forma_pago);
      if (filtros.cliente_id) params.append('cliente_id', filtros.cliente_id);
      if (filtros.estado) params.append('estado', filtros.estado);

      console.log('🔍 Obteniendo ventas...', Object.fromEntries(params));

      const response = await fetch(`${API_URL}/ventas?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || error.details || 'Error obteniendo ventas'
        );
      }

      const data = await response.json();

      // El backend puede devolver directamente el array o un objeto con data
      const ventas = Array.isArray(data) ? data : data.data || [];
      const total = parseInt(
        response.headers.get('X-Total-Count') || ventas.length
      );

      console.log('✅ Ventas obtenidas:', ventas.length);
      return { data: ventas, total };
    } catch (error) {
      console.error('❌ Error en obtenerVentas:', error);
      throw error;
    }
  },

  /**
   * Obtener una venta por ID con todos sus detalles
   */
  async obtenerVentaPorId(id) {
    try {
      console.log('🔍 Obteniendo venta:', id);

      const response = await fetch(`${API_URL}/ventas/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo venta');
      }

      const data = await response.json();
      console.log('✅ Venta obtenida:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en obtenerVentaPorId:', error);
      throw error;
    }
  },

  /**
   * Crear nueva venta con items y cálculos automáticos
   */
  async crearVenta(ventaData) {
    try {
      console.log('➕ Creando venta:', ventaData);

      // Validar datos antes de enviar
      if (!ventaData.cliente_id) {
        throw new Error('Debe seleccionar un cliente');
      }

      if (!ventaData.items || ventaData.items.length === 0) {
        throw new Error('Debe agregar al menos un producto');
      }

      const response = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        const error = await response.json();
        // Mostrar errores de validación si existen
        if (error.detalles && Array.isArray(error.detalles)) {
          throw new Error(error.detalles.join(', '));
        }
        throw new Error(error.error || error.details || 'Error creando venta');
      }

      const data = await response.json();
      console.log('✅ Venta creada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en crearVenta:', error);
      throw error;
    }
  },

  /**
   * Actualizar venta existente
   */
  async actualizarVenta(id, ventaData) {
    try {
      console.log('✏️ Actualizando venta:', id, ventaData);

      const response = await fetch(`${API_URL}/ventas/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error actualizando venta');
      }

      const data = await response.json();
      console.log('✅ Venta actualizada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en actualizarVenta:', error);
      throw error;
    }
  },

  /**
   * Anular venta (recomendado sobre eliminar)
   */
  async anularVenta(id, motivo) {
    try {
      if (!motivo || motivo.trim() === '') {
        throw new Error('Debe proporcionar un motivo de anulación');
      }

      console.log('❌ Anulando venta:', id, 'Motivo:', motivo);

      const response = await fetch(`${API_URL}/ventas/${id}/anular`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ motivo_anulacion: motivo }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error anulando venta');
      }

      const data = await response.json();
      console.log('✅ Venta anulada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en anularVenta:', error);
      throw error;
    }
  },

  /**
   * Eliminar venta completamente (restaura inventario)
   */
  async eliminarVenta(id) {
    try {
      console.log('🗑️ Eliminando venta:', id);

      const response = await fetch(`${API_URL}/ventas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando venta');
      }

      const data = await response.json();
      console.log('✅ Venta eliminada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en eliminarVenta:', error);
      throw error;
    }
  },

  /**
   * Obtener reporte de ventas con estadísticas
   */
  async obtenerReporte(filtros = {}) {
    try {
      const params = new URLSearchParams();

      if (filtros.fecha_inicio)
        params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.forma_pago) params.append('forma_pago', filtros.forma_pago);
      if (filtros.agrupado_por)
        params.append('agrupado_por', filtros.agrupado_por);

      console.log('📊 Obteniendo reporte...', Object.fromEntries(params));

      const response = await fetch(`${API_URL}/ventas/reportes?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo reporte');
      }

      const data = await response.json();
      console.log('✅ Reporte obtenido:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en obtenerReporte:', error);
      throw error;
    }
  },

  // ============= CLIENTES =============

  /**
   * Obtener todos los clientes activos
   */
  async obtenerClientes(filtros = {}) {
    try {
      console.log('👥 Obteniendo clientes...');

      const params = new URLSearchParams();
      if (filtros.tipo_cliente)
        params.append('tipo_cliente', filtros.tipo_cliente);
      if (filtros.ciudad) params.append('ciudad', filtros.ciudad);
      if (filtros.provincia) params.append('provincia', filtros.provincia);

      const response = await fetch(`${API_URL}/clientes?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo clientes');
      }

      const data = await response.json();
      console.log('✅ Clientes obtenidos:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error en obtenerClientes:', error);
      // Devolver array vacío en caso de error para no romper el UI
      return [];
    }
  },

  /**
   * Buscar clientes por criterios
   */
  async buscarClientes(criterios = {}) {
    try {
      const params = new URLSearchParams();

      if (criterios.nombre) params.append('nombre', criterios.nombre);
      if (criterios.cedula) params.append('cedula', criterios.cedula);
      if (criterios.telefono) params.append('telefono', criterios.telefono);
      if (criterios.email) params.append('email', criterios.email);

      console.log('🔎 Buscando clientes:', Object.fromEntries(params));

      const response = await fetch(`${API_URL}/clientes/buscar?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error buscando clientes');
      }

      const data = await response.json();
      console.log('✅ Clientes encontrados:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error en buscarClientes:', error);
      return [];
    }
  },

  /**
   * Crear nuevo cliente
   */
  async crearCliente(clienteData) {
    try {
      console.log('➕ Creando cliente:', clienteData);

      const response = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(clienteData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando cliente');
      }

      const data = await response.json();
      console.log('✅ Cliente creado:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en crearCliente:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de clientes
   */
  async obtenerEstadisticasClientes() {
    try {
      console.log('📊 Obteniendo estadísticas de clientes...');

      const response = await fetch(`${API_URL}/clientes/estadisticas`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo estadísticas');
      }

      const data = await response.json();
      console.log('✅ Estadísticas obtenidas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en obtenerEstadisticasClientes:', error);
      throw error;
    }
  },

  /**
   * Obtener top clientes por ventas
   */
  async obtenerTopClientes(limite = 10) {
    try {
      console.log(`🏆 Obteniendo top ${limite} clientes...`);

      const response = await fetch(`${API_URL}/clientes/top?limite=${limite}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo top clientes');
      }

      const data = await response.json();
      console.log('✅ Top clientes obtenidos:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error en obtenerTopClientes:', error);
      throw error;
    }
  },
};

export default ventasService;
