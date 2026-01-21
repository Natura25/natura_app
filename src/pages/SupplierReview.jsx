import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import './supplierReview.css';
import '../styles/normalize.css';

const SupplierReview = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const emptyForm = {
    numeroCuenta: '',
    clienteId: '',
    nombre: '',
    apellido: '',
    celular: '',
    correo: '',
    rnc: '',
    nombreInstitucional: '',
    telefono: '',
    direccion: '',
    fechaCreacion: '000-00-0000',
  };
  const [formData, setFormData] = useState(emptyForm);

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
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const handleOpenCreate = () => {
    setFormData(emptyForm);
    setShowCreateModal(true);
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
  };

  const handleSearchAccount = (e) => {
    e.preventDefault();
    if (!formData.numeroCuenta.trim()) return;
    setIsSearching(true);
    // Simula llamada a backend y autocompleta campos.
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        clienteId: prev.numeroCuenta,
        nombre: 'Juan',
        apellido: 'De los palotes',
        celular: '000-000-0000',
        correo: 'de_los_palotes@natura.com',
        rnc: '546-05645-54',
        nombreInstitucional: 'De los palotes',
        telefono: '000-000-0000',
        direccion: '000-000-0000',
      }));
      setIsSearching(false);
    }, 650);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    console.log('Nuevo suplidor', formData);
    setShowCreateModal(false);
  };

  const handleBackToSuplidores = () => {
    navigate('/suplidores');
  };

  const handleExport = (format) => {
    console.log(`Exporting to ${format}`);
    setExportDropdownOpen(false);
    // Add export logic here
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.export-dropdown-container')) {
        setExportDropdownOpen(false);
      }
    };

    if (exportDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [exportDropdownOpen]);

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
                  <div className="export-dropdown-container">
                    <button 
                      className="btn-secondary"
                      onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    >
                      Exportar ▼
                    </button>
                    {exportDropdownOpen && (
                      <div className="export-dropdown">
                        <button 
                          className="export-option"
                          onClick={() => handleExport('EXCEL')}
                        >
                          EXCEL
                        </button>
                        <button 
                          className="export-option"
                          onClick={() => handleExport('CSV')}
                        >
                          CSV
                        </button>
                        <button 
                          className="export-option"
                          onClick={() => handleExport('PDF')}
                        >
                          PDF
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={handleOpenCreate}
                  >
                    Crear +
                  </button>
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
                      {Array.from({ length: 16 }).map((_, index) => (
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
        {showCreateModal && (
          <div className="create-supplier-overlay">
            <div className="create-supplier-modal">
              <header className="create-modal-header">
                <h3>Registro de suplidor</h3>
                <button
                  className="icon-button close-modal-btn"
                  onClick={handleCloseCreate}
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </header>
              <form className="create-supplier-form" onSubmit={handleSubmitCreate}>
                <div className="form-row search-row">
                  <label>
                    Número de cuenta
                    <div className="search-field">
                      <input
                        type="text"
                        name="numeroCuenta"
                        value={formData.numeroCuenta}
                        onChange={handleFieldChange}
                        required
                      />
                      <button
                        type="button"
                        className="btn-secondary search-btn"
                        onClick={handleSearchAccount}
                        disabled={isSearching}
                      >
                        {isSearching ? 'Buscando…' : 'Buscar'}
                      </button>
                    </div>
                  </label>
                  <label>
                    Cliente ID
                    <input
                      id="inputed"
                      type="text"
                      name="clienteId"
                      value={formData.clienteId}
                      onChange={handleFieldChange}
                      readOnly
                      disabled
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Nombre
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleFieldChange}
                      required
                    />
                  </label>
                  <label>
                    Apellido
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleFieldChange}
                      required
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Celular
                    <input
                      type="text"
                      name="celular"
                      value={formData.celular}
                      onChange={handleFieldChange}
                    />
                  </label>
                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo}
                      onChange={handleFieldChange}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    RNC
                    <input
                      type="text"
                      name="rnc"
                      value={formData.rnc}
                      onChange={handleFieldChange}
                    />
                  </label>
                  <label>
                    Nombre institucional
                    <input
                      type="text"
                      name="nombreInstitucional"
                      value={formData.nombreInstitucional}
                      onChange={handleFieldChange}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Teléfono
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleFieldChange}
                    />
                  </label>
                  <label>
                    Dirección
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleFieldChange}
                    />
                  </label>
                </div>

                <input
                  type="hidden"
                  name="fechaCreacion"
                  value={formData.fechaCreacion}
                  onChange={handleFieldChange}
                />

                <div className="create-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCloseCreate}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupplierReview;


