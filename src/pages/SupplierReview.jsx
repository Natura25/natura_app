import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import './supplierReview.css';
import '../styles/normalize.css';

const SupplierReview = () => {
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

  const handleBackToSuplidores = () => {
    navigate('/suplidores');
  };

  return (
    <div className="dashboard supplier-review-page">
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
              onClick={handleBackToSuplidores}
              title="Volver a Suplidores"
            >
              ←
            </button>
            <h1>NaturaCifra / Suplidores / CRUD</h1>
          </div>
        </header>

        <div className="content-area">
          <div className="dashboard-content">
            <div className="supplier-review-container">
              <header className="supplier-review-header">
                <div>
                  <p className="supplier-pill">Suplidores</p>
                  <h2>Listado de suplidores</h2>
                  <p className="supplier-description">
                    Revisa y administra los suplidores registrados en el sistema.
                  </p>
                </div>
                <div className="supplier-header-actions">
                  <button className="btn-secondary">Exportar ▼</button>
                  <button className="btn-primary">Crear +</button>
                </div>
              </header>

              <section className="supplier-table-section">
                <div className="supplier-table-wrapper">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" />
                        </th>
                        <th>Suplidor</th>
                        <th>Dirección</th>
                        <th>Contacto</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 8 }).map((_, index) => (
                        <tr key={index}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td>Value {index + 1}</td>
                          <td>Value {index + 2}</td>
                          <td>Value {index + 3}</td>
                          <td className="supplier-actions-cell">
                            <button
                              type="button"
                              className="icon-button"
                              aria-label="Editar suplidor"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              aria-label="Eliminar suplidor"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierReview;


