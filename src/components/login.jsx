import React, { useState } from 'react';
import '../login.css'; // Asegúrate de importar tu archivo CSS

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login exitoso:', data);
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <h1>Iniciar Sesión</h1>

        {error && <div className="error">{error}</div>}

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-container">
            <div className="input-group">
              <input
                type="text"
                name="username"
                id="username"
                placeholder="Usuario"
                value={formData.username}
                onChange={handleChange}
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
                required
              />
            </div>

            <button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Iniciando...' : 'Entrar'}
            </button>
          </div>

          <div className="links">
            <a href="#">¿Olvidaste tu contraseña?</a>
            <a href="#">Crear cuenta</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
