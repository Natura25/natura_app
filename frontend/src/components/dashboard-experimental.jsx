// DashboardExperimental.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // ¡Importa tu archivo CSS aquí!

const DashboardExperimental = () => {
  const [user, setUser] = useState({ username: 'Usuario' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Función para obtener un número aleatorio para la altura de las barras del gráfico
  const getRandomBarHeight = () =>
    `${Math.floor(Math.random() * (100 - 30 + 1)) + 30}%`;

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          'https://natura-app.onrender.com/api/auth/check-session',
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user || { username: 'Usuario' });
          } else {
            navigate('/'); // Redirigir al login si no está autenticado
          }
        } else if (response.status === 401) {
          navigate('/'); // Redirigir al login si no está autenticado
        } else {
          // Si hay otros errores de servidor, pero no son de autenticación,
          // puedes decidir permitir el acceso pero con una advertencia
          console.warn(
            'No se pudo verificar la sesión, pero permitiendo acceso por defecto.'
          );
          // setError(`Error al verificar sesión: ${response.statusText}`); // Mostrar error si lo prefieres
        }
      } catch (err) {
        console.error('Error de red al verificar autenticación:', err);
        // Si hay un error de red (servidor no disponible, etc.),
        // podrías mostrar un error o permitir acceso por defecto para pruebas.
        setError(
          'No se pudo conectar con el servidor de autenticación. Inténtalo de nuevo.'
        );
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]); // Añade navigate a las dependencias para evitar warnings

  const handleLogout = async () => {
    try {
      const response = await fetch(
        'https://natura-app.onrender.com/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (response.ok) {
        navigate('/'); // Redirigir al login después de cerrar sesión
      } else {
        console.error('Error al cerrar sesión:', response.statusText);
        // Puedes manejar el error mostrando un mensaje al usuario
        alert('Hubo un error al cerrar sesión. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error de red al cerrar sesión:', err);
      alert('Error de conexión. No se pudo cerrar la sesión.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>¡Ups! Algo salió mal.</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚀 Dashboard Principal</h1>
          <div className="user-info">
            <span>Bienvenido, **{user?.username || 'Usuario'}**</span>
            <button onClick={handleLogout} className="logout-btn">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <ul>
              <li>
                <a href="#" className="nav-link active">
                  <span>📊</span> Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="nav-link">
                  <span>💰</span> Ventas
                </a>
              </li>
              <li>
                <a href="#" className="nav-link">
                  <span>📋</span> Cuentas por Cobrar
                </a>
              </li>
              <li>
                <a href="#" className="nav-link">
                  <span>📝</span> Cuentas Contables
                </a>
              </li>
              <li>
                <a href="#" className="nav-link">
                  <span>💳</span> Cuentas por Pagar
                </a>
              </li>
              <li>
                <a href="#" className="nav-link">
                  <span>👥</span> Usuarios
                </a>
              </li>
              <li>
                <a href="#" className="nav-link">
                  <span>⚙️</span> Configuración
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Content Area */}
        <section className="dashboard-content">
          <h2 className="content-title">Resumen del Día</h2>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <h3>Ventas del Mes</h3>
                <div className="stat-value">$45,230</div>
                <div className="stat-change positive">
                  <span role="img" aria-label="up arrow">
                    ⬆️
                  </span>{' '}
                  +12.5%
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"> pendientes</div>
              <div className="stat-info">
                <h3>Cuentas Pendientes</h3>
                <div className="stat-value">23</div>
                <div className="stat-change negative">
                  <span role="img" aria-label="down arrow">
                    ⬇️
                  </span>{' '}
                  -3.2%
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Usuarios Activos</h3>
                <div className="stat-value">147</div>
                <div className="stat-change positive">
                  <span role="img" aria-label="up arrow">
                    ⬆️
                  </span>{' '}
                  +8.1%
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💲</div>
              <div className="stat-info">
                <h3>Ingresos Totales</h3>
                <div className="stat-value">$128,450</div>
                <div className="stat-change positive">
                  <span role="img" aria-label="up arrow">
                    ⬆️
                  </span>{' '}
                  +15.7%
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Widgets */}
          <div className="dashboard-widgets">
            <div className="widget">
              <h2>📊 Resumen de Actividad</h2>
              <div className="widget-content">
                <p>
                  Gráfico que muestra la actividad reciente en tu plataforma.
                </p>
                <div className="placeholder-chart">
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="widget">
              <h2>📝 Tareas Pendientes</h2>
              <div className="widget-content">
                <ul className="task-list">
                  <li>
                    <span>✅</span> Revisar facturas pendientes
                  </li>
                  <li>
                    <span>🔄</span> Actualizar base de datos de productos
                  </li>
                  <li>
                    <span>📊</span> Generar reporte mensual de ventas
                  </li>
                  <li>
                    <span>📞</span> Contactar clientes morosos
                  </li>
                  <li>
                    <span>🗓️</span> Planificar reunión de equipo
                  </li>
                </ul>
              </div>
            </div>

            <div className="widget">
              <h2>🔔 Notificaciones Recientes</h2>
              <div className="widget-content">
                <div className="notification">
                  <span className="notification-dot"></span>
                  <p>Nueva venta registrada de **$1,250** por María López.</p>
                </div>
                <div className="notification">
                  <span className="notification-dot"></span>
                  <p>Nuevo usuario registrado: **Juan Pérez**.</p>
                </div>
                <div className="notification">
                  <span className="notification-dot"></span>
                  <p>Actualización de inventario para **"Producto X"**.</p>
                </div>
                <div className="notification">
                  <span className="notification-dot"></span>
                  <p>Reporte de fin de mes generado y disponible.</p>
                </div>
              </div>
            </div>

            <div className="widget">
              <h2>📈 Rendimiento por Categoría</h2>
              <div className="widget-content">
                <p>
                  Vista rápida del rendimiento de diferentes categorías de
                  productos/servicios.
                </p>
                <div className="placeholder-chart">
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                  <div
                    className="chart-bar"
                    style={{ '--bar-height': getRandomBarHeight() }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardExperimental;
