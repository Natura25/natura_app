import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import './index.css';
import Login from './components/login.jsx';
import DashboardExperimental from './components/dashboard-experimental.jsx';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>404 - Página no encontrada</h2>
      <p>La ruta que buscas no existe</p>
      <button onClick={() => navigate('/')}>Ir al inicio</button>
    </div>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard-experimental"
          element={<DashboardExperimental />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
