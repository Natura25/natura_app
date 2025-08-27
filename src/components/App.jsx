import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Home from './home';
import Login from './Logs';
import Dashboard from '../pages/Dashboard';
import './App.css';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/home"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />}
      />

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/home"} replace />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
