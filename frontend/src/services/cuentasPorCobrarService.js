// src/services/cuentasPorCobrarService.js

const API_URL =
  import.meta.env.VITE_API_URL || 'https://natura-app.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const cuentasPorCobrarService = {
  // Obtener todas las cuentas con filtros
  async obtenerCuentas(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros);
      console.log(
        '🔍 Obteniendo cuentas por cobrar...',
        `${API_URL}/cuentas-por-cobrar?${params}`
      );

      const response = await fetch(`${API_URL}/cuentas-por-cobrar?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo cuentas');
      }

      const data = await response.json();
      console.log('✅ Cuentas obtenidas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en obtenerCuentas:', error);
      throw error;
    }
  },

  // Obtener una cuenta por ID
  async obtenerCuentaPorId(id) {
    try {
      const response = await fetch(`${API_URL}/cuentas-por-cobrar/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo cuenta');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en obtenerCuentaPorId:', error);
      throw error;
    }
  },

  // Crear nueva cuenta
  async crearCuenta(cuenta) {
    try {
      const response = await fetch(`${API_URL}/cuentas-por-cobrar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cuenta),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando cuenta');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en crearCuenta:', error);
      throw error;
    }
  },

  // Actualizar cuenta
  async actualizarCuenta(id, cuenta) {
    try {
      const response = await fetch(`${API_URL}/cuentas-por-cobrar/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(cuenta),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error actualizando cuenta');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en actualizarCuenta:', error);
      throw error;
    }
  },

  // Eliminar cuenta
  async eliminarCuenta(id) {
    try {
      const response = await fetch(`${API_URL}/cuentas-por-cobrar/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando cuenta');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en eliminarCuenta:', error);
      throw error;
    }
  },

  // Registrar pago
  async registrarPago(id, pago) {
    try {
      console.log('💰 Registrando pago...', { id, pago });

      const response = await fetch(
        `${API_URL}/cuentas-por-cobrar/${id}/pagar`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(pago),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error registrando pago');
      }

      const data = await response.json();
      console.log('✅ Pago registrado:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en registrarPago:', error);
      throw error;
    }
  },

  // Obtener historial de pagos
  async obtenerHistorialPagos(id) {
    try {
      const response = await fetch(
        `${API_URL}/cuentas-por-cobrar/${id}/pagos`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo historial');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en obtenerHistorialPagos:', error);
      throw error;
    }
  },

  // Obtener dashboard
  async obtenerDashboard(cliente_id = null) {
    try {
      const url = cliente_id
        ? `${API_URL}/cuentas-por-cobrar/dashboard?cliente_id=${cliente_id}`
        : `${API_URL}/cuentas-por-cobrar/dashboard`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo dashboard');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en obtenerDashboard:', error);
      throw error;
    }
  },

  // Obtener cuentas por cliente
  async obtenerCuentasPorCliente(cliente_id) {
    try {
      const response = await fetch(
        `${API_URL}/cuentas-por-cobrar/cliente/${cliente_id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo cuentas del cliente');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en obtenerCuentasPorCliente:', error);
      throw error;
    }
  },

  // Marcar cuentas vencidas
  async marcarVencidas() {
    try {
      const response = await fetch(
        `${API_URL}/cuentas-por-cobrar/marcar-vencidas`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error marcando cuentas vencidas');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Error en marcarVencidas:', error);
      throw error;
    }
  },

  // Obtener clientes (para el selector) - DESDE EL ENDPOINT DE CXC
  async obtenerClientes() {
    try {
      console.log('👥 Obteniendo clientes desde CxC...');

      const response = await fetch(
        `${API_URL}/cuentas-por-cobrar/clientes-disponibles`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error obteniendo clientes');
      }

      const data = await response.json();
      console.log('✅ Clientes obtenidos:', data);

      return data;
    } catch (error) {
      console.error('❌ Error en obtenerClientes:', error);
      throw error;
    }
  },
};
