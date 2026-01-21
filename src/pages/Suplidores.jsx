import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import './Suplidores.css';
import '../styles/normalize.css';

const Suplidores = () => {
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

  const [activeMenu, setActiveMenu] = useState('suplidores');

  // Opciones de Suplidores como módulos principales
  const suplidoresModules = [
    {
      id: 'crud',
      label: 'Lista de suplidores',
      icon: '📝',
      color: '#10B981',
      description: 'Gestiona registro de suplidores',
    },
    {
      id: 'purchase',
      label: 'Registrar compra a suplidor',
      icon: '🛒',
      color: '#3B82F6',
      description: 'Registra nuevas órdenes',
    },
    {
      id: 'accounts',
      label: 'Cuentas por pagar',
      icon: '💰',
      color: '#F59E0B',
      description: 'Consulta obligaciones abiertas',
    },
    {
      id: 'register-payment',
      label: 'Registrar pago a suplidor',
      icon: '💳',
      color: '#8B5CF6',
      description: 'Aplica pagos y conciliaciones',
    },
    {
      id: 'alerts',
      label: 'Notificación de vencimiento',
      icon: '🔔',
      color: '#EF4444',
      description: 'Configura alertas de vencimiento',
    },
  ];

  const handleModuleClick = (moduleId) => {
    if (moduleId === 'crud') {
      navigate('/suplidores/crud');
      return;
    }
    console.log(`Clicked on module: ${moduleId}`);
    // Add navigation logic here for each module
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="dashboard suplidores-page">
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
          <div className="header-title-section">
            <button 
              className="back-to-dashboard-btn"
              onClick={handleBackToDashboard}
              title="Volver al Dashboard"
            >
              ←
            </button>
            <h1>NaturaCifra / Suplidores</h1>
          </div>
        </header>

        <div className="content-area">
          <div className="dashboard-content">
            {/* Suplidores Modules Grid */}
            <div className="modules-grid">
              {suplidoresModules.map((module) => (
                <button
                  key={module.id}
                  className="module-card"
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Suplidores;

