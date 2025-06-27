import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const [activeMenu, setActiveMenu] = useState('overview');

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Natura Finance</h2>
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
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name || 'User'}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
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
          <h1>{menuItems.find(item => item.id === activeMenu)?.label}</h1>
          <div className="header-actions">
            <button className="notification-btn">🔔</button>
          </div>
        </header>

        <div className="content-area">
          {activeMenu === 'overview' && (
            <div className="dashboard-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Revenue</h3>
                  <p className="stat-value">$124,563</p>
                  <span className="stat-change positive">+12.5%</span>
                </div>
                <div className="stat-card">
                  <h3>Active Users</h3>
                  <p className="stat-value">1,234</p>
                  <span className="stat-change positive">+8.2%</span>
                </div>
                <div className="stat-card">
                  <h3>Transactions</h3>
                  <p className="stat-value">5,678</p>
                  <span className="stat-change negative">-2.1%</span>
                </div>
                <div className="stat-card">
                  <h3>Growth Rate</h3>
                  <p className="stat-value">23.4%</p>
                  <span className="stat-change positive">+15.7%</span>
                </div>
              </div>
              
              <div className="chart-section">
                <h2>Revenue Overview</h2>
                <div className="chart-placeholder">
                  <p>Chart visualization would go here</p>
                  <div className="chart-bars">
                    {[60, 80, 45, 90, 70, 85, 95].map((height, index) => (
                      <div 
                        key={index} 
                        className="chart-bar" 
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'analytics' && (
            <div className="dashboard-content">
              <h2>Analytics Dashboard</h2>
              <p>Detailed analytics and insights will be displayed here.</p>
            </div>
          )}

          {activeMenu === 'reports' && (
            <div className="dashboard-content">
              <h2>Reports</h2>
              <p>Generate and view various reports here.</p>
            </div>
          )}

          {activeMenu === 'settings' && (
            <div className="dashboard-content">
              <h2>Settings</h2>
              <p>Configure your account and application settings.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
