// src/services/inventarioService.js

const API_URL =
  import.meta.env.VITE_API_URL || 'https://natura-app.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const inventarioService = {
  // Obtener todos los productos con filtros opcionales
  async obtenerProductos(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      console.log(
        '🔍 Obteniendo productos...',
        `${API_URL}/inventario/productos?${params}`
      );

      const response = await fetch(
        `${API_URL}/inventario/productos?${params}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo productos');
      }

      const data = await response.json();
      const total = parseInt(response.headers.get('X-Total-Count') || '0');

      return { data, total };
    } catch (error) {
      console.error('❌ Error en obtenerProductos:', error);
      throw error;
    }
  },

  // Obtener un producto específico por ID
  async obtenerProductoPorId(id) {
    try {
      const response = await fetch(`${API_URL}/inventario/productos/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo producto');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en obtenerProductoPorId:', error);
      throw error;
    }
  },

  // Crear nuevo producto
  async crearProducto(producto) {
    try {
      const response = await fetch(`${API_URL}/inventario/productos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(producto),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando producto');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en crearProducto:', error);
      throw error;
    }
  },

  // Actualizar producto existente
  async actualizarProducto(id, producto) {
    try {
      const response = await fetch(`${API_URL}/inventario/productos/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(producto),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error actualizando producto');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en actualizarProducto:', error);
      throw error;
    }
  },

  // Eliminar producto
  async eliminarProducto(id) {
    try {
      const response = await fetch(`${API_URL}/inventario/productos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando producto');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en eliminarProducto:', error);
      throw error;
    }
  },

  // Obtener movimientos de inventario
  async obtenerMovimientos(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await fetch(
        `${API_URL}/inventario/movimientos?${params}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo movimientos');
      }

      const data = await response.json();
      const total = parseInt(response.headers.get('X-Total-Count') || '0');

      return { data, total };
    } catch (error) {
      console.error('❌ Error en obtenerMovimientos:', error);
      throw error;
    }
  },

  // Registrar entrada de inventario
  async registrarEntrada(datos) {
    try {
      const response = await fetch(
        `${API_URL}/inventario/movimientos/entrada`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(datos),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error registrando entrada');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en registrarEntrada:', error);
      throw error;
    }
  },

  // Registrar salida de inventario
  async registrarSalida(datos) {
    try {
      const response = await fetch(`${API_URL}/inventario/movimientos/salida`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error registrando salida');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en registrarSalida:', error);
      throw error;
    }
  },

  // Registrar ajuste de inventario
  async registrarAjuste(datos) {
    try {
      const response = await fetch(`${API_URL}/inventario/movimientos/ajuste`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error registrando ajuste');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en registrarAjuste:', error);
      throw error;
    }
  },

  // Obtener alertas de stock bajo
  async obtenerAlertasStock() {
    try {
      console.log('🔔 Obteniendo alertas de stock...');

      const response = await fetch(`${API_URL}/inventario/alertas/stock-bajo`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo alertas');
      }

      const data = await response.json();
      console.log('✅ Alertas obtenidas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en obtenerAlertasStock:', error);
      throw error;
    }
  },

  // ⭐ NUEVO: Obtener categorías (cuentas contables)
  async obtenerCategorias() {
    try {
      console.log('📁 Obteniendo categorías...');

      const response = await fetch(`${API_URL}/contabilidad`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo categorías');
      }

      const data = await response.json();
      console.log('✅ Categorías obtenidas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en obtenerCategorias:', error);
      throw error;
    }
  },

  // Descargar reporte de inventario
  async descargarReporteInventario(formato = 'pdf') {
    try {
      const response = await fetch(
        `${API_URL}/inventario/reportes/inventario?formato=${formato}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error generando reporte');
      }

      // Descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-inventario-${Date.now()}.${
        formato === 'excel' ? 'xlsx' : 'pdf'
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('❌ Error en descargarReporteInventario:', error);
      throw error;
    }
  },

  // Descargar reporte de movimientos
  async descargarReporteMovimientos(filtros = {}, formato = 'pdf') {
    try {
      const params = new URLSearchParams({ ...filtros, formato });
      const response = await fetch(
        `${API_URL}/inventario/reportes/movimientos?${params}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error generando reporte');
      }

      // Descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-movimientos-${Date.now()}.${
        formato === 'excel' ? 'xlsx' : 'pdf'
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('❌ Error en descargarReporteMovimientos:', error);
      throw error;
    }
  },
};
