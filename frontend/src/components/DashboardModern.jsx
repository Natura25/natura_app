import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const DashboardModern = () => {
  const [user, setUser] = useState({ username: 'Usuario' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const API_URL =
    /*import.meta.env.VITE_API_URL ||*/ 'http://localhost:3000/api/auth';

  // Función para obtener un número aleatorio para la altura de las barras del gráfico
  const getRandomBarHeight = () =>
    `${Math.floor(Math.random() * (100 - 30 + 1)) + 30}%`;

  // Actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (!token || !savedUser) {
          console.log('❌ No token or user found');
          navigate('/');
          return;
        }

        // Parsear usuario guardado
        const userData = JSON.parse(savedUser);
        setUser(userData);

        // Verificar token con el backend
        const response = await fetch(`${API_URL}/session`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.log('❌ Token inválido o expirado');

            // Intentar refrescar el token
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const refreshResponse = await fetch(`${API_URL}/refresh`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('token', refreshData.token);
                localStorage.setItem('refreshToken', refreshData.refreshToken);
                console.log('✅ Token refrescado exitosamente');
                // Volver a verificar con el nuevo token
                window.location.reload();
                return;
              }
            }

            // Si no se pudo refrescar, cerrar sesión
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            navigate('/');
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Token válido:', data);

        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        setError('');
      } catch (error) {
        console.error('❌ Error checking auth:', error);
        setError('Error al verificar la autenticación');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');

      // Llamar al endpoint de logout
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Logout exitoso');
    } catch (err) {
      console.error('❌ Error en logout:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>¡Ups! Algo salió mal</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="error-btn">
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="dashboard-modern">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🌿</div>
            {!sidebarCollapsed && <span className="logo-text">Natura</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span className="toggle-icon">≡</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <a href="/dashboard" className="nav-link active">
                <span className="nav-icon">📊</span>
                {!sidebarCollapsed && (
                  <span className="nav-text">Dashboard</span>
                )}
              </a>
            </li>
            <li className="nav-item">
              <button className="nav-link" onClick={() => navigate('/ventas')}>
                <span className="nav-icon">💰</span>
                {!sidebarCollapsed && <span className="nav-text">Ventas</span>}
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => navigate('/cuentas-por-cobrar')}
              >
                <span className="nav-icon">📋</span>
                {!sidebarCollapsed && (
                  <span className="nav-text">Cuentas por Cobrar</span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                onClick={() => navigate('/inventario')}
              >
                <span className="nav-icon">📦</span>
                {!sidebarCollapsed && (
                  <span className="nav-text">Contabilidad</span>
                )}
              </button>
            </li>
            <li className="nav-item">
              <a href="/cuentas-pagar" className="nav-link">
                <span className="nav-icon">💳</span>
                {!sidebarCollapsed && (
                  <span className="nav-text">Cuentas por Pagar</span>
                )}
              </a>
            </li>
            <button className="nav-link" onClick={() => navigate('/empleados')}>
              <span className="nav-icon"></span>
              {!sidebarCollapsed && <span className="nav-text">Empleados</span>}
            </button>
            <button className="nav-link" onClick={() => navigate('/nominas')}>
              <span className="nav-icon"></span>
              {!sidebarCollapsed && <span className="nav-text">Nomina</span>}
            </button>
            <li className="nav-item">
              <a href="/configuracion" className="nav-link">
                <span className="nav-icon">⚙️</span>
                {!sidebarCollapsed && (
                  <span className="nav-text">Configuración</span>
                )}
              </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <span className="user-name">{user?.username || 'Usuario'}</span>
                <span className="user-role">
                  {user?.rol_id === 1 ? 'Administrador' : 'Usuario'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">Dashboard</h1>
            <div className="breadcrumb">
              <span>Inicio</span>
              <span className="breadcrumb-separator">•</span>
              <span>Dashboard</span>
            </div>
          </div>

          <div className="header-right">
            <div className="datetime-info">
              <div className="current-time">{formatTime(currentTime)}</div>
              <div className="current-date">{formatDate(currentTime)}</div>
            </div>

            <div className="header-actions">
              <button className="notification-btn">
                <span className="notification-icon">🔔</span>
                <span className="notification-badge">3</span>
              </button>

              <button className="logout-btn" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                <span>Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-content">
            <h2 className="welcome-title">
              ¡Bienvenido de vuelta, {user?.username || 'Usuario'}! 👋
            </h2>
            <p className="welcome-subtitle">
              Aquí tienes un resumen de tu negocio hoy
            </p>
          </div>
          <div className="welcome-illustration">
            <div className="floating-elements">
              <div className="float-element">📈</div>
              <div className="float-element">💰</div>
              <div className="float-element">🎯</div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card revenue">
              <div className="stat-header">
                <div className="stat-icon">💰</div>
                <div className="stat-trend positive">+12.5%</div>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Ventas del Mes</h3>
                <div className="stat-value">$45,230</div>
                <div className="stat-subtitle">Vs mes anterior</div>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-header">
                <div className="stat-icon">⏳</div>
                <div className="stat-trend negative">-3.2%</div>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Cuentas Pendientes</h3>
                <div className="stat-value">23</div>
                <div className="stat-subtitle">Por cobrar</div>
              </div>
            </div>

            <div className="stat-card users">
              <div className="stat-header">
                <div className="stat-icon">👥</div>
                <div className="stat-trend positive">+8.1%</div>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Usuarios Activos</h3>
                <div className="stat-value">147</div>
                <div className="stat-subtitle">Este mes</div>
              </div>
            </div>

            <div className="stat-card income">
              <div className="stat-header">
                <div className="stat-icon">📈</div>
                <div className="stat-trend positive">+15.7%</div>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">Ingresos Totales</h3>
                <div className="stat-value">$128,450</div>
                <div className="stat-subtitle">Acumulado</div>
              </div>
            </div>
          </div>
        </section>

        {/* Widgets Grid */}
        <section className="widgets-section">
          <div className="widgets-grid">
            <div className="widget chart-widget">
              <div className="widget-header">
                <h3 className="widget-title">📊 Actividad Reciente</h3>
                <div className="widget-actions">
                  <button className="widget-action">📅</button>
                  <button className="widget-action">⚙️</button>
                </div>
              </div>
              <div className="widget-content">
                <div className="chart-container">
                  <div className="chart-bars">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className="chart-bar"
                        style={{
                          height: getRandomBarHeight(),
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="chart-labels">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="widget tasks-widget">
              <div className="widget-header">
                <h3 className="widget-title">📝 Tareas Pendientes</h3>
                <button className="add-task-btn">+</button>
              </div>
              <div className="widget-content">
                <div className="task-list">
                  <div className="task-item completed">
                    <div className="task-checkbox">✅</div>
                    <span className="task-text">
                      Revisar facturas pendientes
                    </span>
                  </div>
                  <div className="task-item">
                    <div className="task-checkbox">⭕</div>
                    <span className="task-text">Actualizar base de datos</span>
                  </div>
                  <div className="task-item">
                    <div className="task-checkbox">⭕</div>
                    <span className="task-text">Generar reporte mensual</span>
                  </div>
                  <div className="task-item">
                    <div className="task-checkbox">⭕</div>
                    <span className="task-text">Conciliación bancaria</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="widget notifications-widget">
              <div className="widget-header">
                <h3 className="widget-title">🔔 Notificaciones</h3>
                <span className="notification-count">4</span>
              </div>
              <div className="widget-content">
                <div className="notification-list">
                  <div className="notification-item">
                    <div className="notification-dot new"></div>
                    <div className="notification-content">
                      <p className="notification-text">
                        Nueva venta de <strong>$1,250</strong>
                      </p>
                      <span className="notification-time">Hace 5 min</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-dot"></div>
                    <div className="notification-content">
                      <p className="notification-text">
                        Usuario registrado: <strong>Juan Pérez</strong>
                      </p>
                      <span className="notification-time">Hace 1 hora</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-dot"></div>
                    <div className="notification-content">
                      <p className="notification-text">
                        Pago recibido: <strong>$5,000</strong>
                      </p>
                      <span className="notification-time">Hace 3 horas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h3 className="section-title">Acciones Rápidas</h3>
          <div className="quick-actions-grid">
            <a href="/ventas/nueva" className="quick-action-card">
              <div className="action-icon">➕</div>
              <div className="action-text">Nueva Venta</div>
            </a>
            <a href="/conciliacion/nueva" className="quick-action-card">
              <div className="action-icon">⚖️</div>
              <div className="action-text">Conciliar Banco</div>
            </a>
            <a href="/reportes" className="quick-action-card">
              <div className="action-icon">📊</div>
              <div className="action-text">Ver Reportes</div>
            </a>
            <a href="/usuarios/nuevo" className="quick-action-card">
              <div className="action-icon">👤</div>
              <div className="action-text">Nuevo Usuario</div>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardModern;
