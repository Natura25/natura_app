import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './components/login';
import DashboardModern from './components/DashboardModern';
import Inventory from './components/Inventario'; //
import ProtectedRoute from './components/ProtectedRoute'; //
import Ventas from './components/Ventas';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas - no necesitan autenticación */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas - necesitan autenticación */}
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

        {/* <Route path="/auth/confirm" element={<AuthConfirm />} /> */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
