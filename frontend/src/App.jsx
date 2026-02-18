import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './components/login';
import DashboardModern from './components/DashboardModern';
import Inventory from './components/Inventario';
import ProtectedRoute from './components/ProtectedRoute';
import Ventas from './components/ventas';
import CuentasPorCobrar from './components/cuentasPorCobrar';
import Empleados from './components/Empleados';
import Nominas from './components/Nominas';

function App() {
  return (
    <Router>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardModern />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute>
              <Ventas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cuentas-por-cobrar"
          element={
            <ProtectedRoute>
              <CuentasPorCobrar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/empleados"
          element={
            <ProtectedRoute>
              <Empleados />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nominas"
          element={
            <ProtectedRoute>
              <Nominas />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
