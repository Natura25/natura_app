import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../login.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación básica
    if (!formData.username || !formData.password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'https://natura-app.onrender.com/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include', // MUY importante para enviar cookies
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Login exitoso:', data);
        // Redirigir al dashboard experimental
        navigate('/dashboard-experimental');
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <h1>Iniciar Sesión</h1>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-container">
            <div className="input-group">
              <input
                type="text"
                name="username"
                id="username"
                placeholder="Usuario"
                value={formData.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                required
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Iniciando...' : 'Entrar'}
            </button>
          </div>

          <div className="links">
            <a href="#" onClick={(e) => e.preventDefault()}>
              ¿Olvidaste tu contraseña?
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Crear cuenta
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
