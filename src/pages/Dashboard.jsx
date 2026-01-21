import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import '../styles/normalize.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const menuItems = [
    { id: 'perfil', label: 'Perfil', icon: '👤' },
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
    { id: 'something1', label: 'Something', icon: '📋' },
    { id: 'something2', label: 'Something', icon: '📊' },
  ];

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [activeModule, setActiveModule] = useState(null);

  // Business modules grid
  const businessModules = [
    { id: 'clientes', label: 'Clientes', icon: '👥', color: '#3B82F6' },
    { id: 'suplidores', label: 'Suplidores', icon: '🚚', color: '#10B981' },
    { id: 'activos', label: 'Activos', icon: '💎', color: '#8B5CF6' },
    { id: 'inventario', label: 'Inventario', icon: '🏢', color: '#EF4444' },
    { id: 'costos', label: 'Costos', icon: '💰', color: '#06B6D4' },
    { id: 'conciliaciones', label: 'Conciliaciones', icon: '🏛️', color: '#84CC16' },
    { id: 'impuestos', label: 'Impuestos', icon: '📜', color: '#F97316' },
    { id: 'reportes', label: 'Reportes financieros', icon: '📊', color: '#EC4899' },
  ];

  const moduleActions = {
    suplidores: [
      {
        id: 'crud',
        title: 'CRUD',
        description: 'Gestiona la base de datos de suplidores',
      },
      {
        id: 'purchase',
        title: 'Crear compra a suplidor',
        description: 'Registra nuevas órdenes o solicitudes',
      },
      {
        id: 'accounts',
        title: 'Ver cuentas por pagar',
        description: 'Consulta obligaciones abiertas',
      },
      {
        id: 'register-payment',
        title: 'Registrar pago a suplidor',
        description: 'Aplica pagos y conciliaciones',
      },
      {
        id: 'alerts',
        title: 'Notificación de vencimiento',
        description: 'Configura alertas de vencimiento',
      },
    ],
  };

  const handleModuleClick = (moduleId) => {
    if (moduleId === 'suplidores') {
      navigate('/suplidores');
      return;
    }
    setActiveModule((prev) => (prev === moduleId ? null : moduleId));
  };

  const activeModuleLabel =
    businessModules.find((module) => module.id === activeModule)?.label || '';

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>NaturaCifra</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user?.name || 'User'} 
                  className="user-profile-image"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name || 'Username'}</p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1>NaturaCifra / Dashboard</h1>
          {/* <div className="header-actions">
            <button className="notification-btn">🔔</button>
          </div> */}
        </header>

        <div className="content-area">
          <div className="dashboard-content">
            {/* Business Modules Grid */}
            <div className="modules-grid">
              {businessModules.map((module) => (
                <button
                  key={module.id}
                  className={`module-card ${activeModule === module.id ? 'selected' : ''}`}
                  onClick={() => handleModuleClick(module.id)}
                  style={{ '--module-color': module.color }}
                >
                  <div className="module-icon">
                    <span
                      className="module-emoji"
                      role="img"
                      aria-label={module.label}
                    >
                      {module.icon}
                    </span>
                  </div>
                  <span className="module-label">{module.label}</span>
                </button>
              ))}
            </div>

            {activeModule && moduleActions[activeModule] && (
              <section className="module-submenu">
                <div className="submenu-header">
                  <div>
                    <p className="submenu-pill">{activeModuleLabel}</p>
                    <h3>Operaciones frecuentes</h3>
                    <p className="submenu-description">
                      Accesos directos para gestionar procesos con{' '}
                      {activeModuleLabel || 'este módulo'}.
                    </p>
                  </div>
                  <button
                    className="submenu-close"
                    onClick={() => setActiveModule(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="submenu-grid">
                  {moduleActions[activeModule].map((action) => (
                    <button 
                      key={action.id} 
                      className="submenu-card"
                      onClick={() => {
                        if (activeModule === 'suplidores') {
                          navigate('/suplidores');
                        }
                      }}
                    >
                      <div className="submenu-card-body">
                        <h4>{action.title}</h4>
                        <p>{action.description}</p>
                      </div>
                      <span className="submenu-card-arrow">➜</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            
            {/* Data Visualizations */}
            <div className="charts-section">
              <div className="chart-container">
                <h3>Indicador 1</h3>
                <div className="chart">
                  <div className="chart-bars">
                    <div className="chart-bar" style={{ height: '60%' }}></div>
                    <div className="chart-bar" style={{ height: '80%' }}></div>
                    <div className="chart-bar" style={{ height: '45%' }}></div>
                  </div>
                  <div className="chart-line">
                    <svg width="100%" height="100%" viewBox="0 0 200 100">
                      <path
                        d="M20 80 Q50 60 80 40 Q110 20 140 30 Q170 40 180 20"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        fill="none"
                      />
                      <circle cx="80" cy="40" r="3" fill="#8B5CF6" />
                      <circle cx="140" cy="30" r="3" fill="#8B5CF6" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="chart-container">
                <h3>Indicador 2</h3>
                <div className="chart">
                  <div className="chart-bars">
                    <div className="chart-bar" style={{ height: '60%' }}></div>
                    <div className="chart-bar" style={{ height: '80%' }}></div>
                    <div className="chart-bar" style={{ height: '45%' }}></div>
                  </div>
                  <div className="chart-line">
                    <svg width="100%" height="100%" viewBox="0 0 200 100">
                      <path
                        d="M20 80 Q50 60 80 40 Q110 20 140 30 Q170 40 180 20"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        fill="none"
                      />
                      <circle cx="80" cy="40" r="3" fill="#000000" />
                      <circle cx="140" cy="30" r="3" fill="#555CF6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </main>
    </div>
  );
};

export default Dashboard;
