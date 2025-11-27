import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Logs.css';
import '../styles/normalize.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple validation
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      setIsLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://natura-app.onrender.com/api';
      
      console.log('🔄 Intentando login con:', formData.email);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error en el inicio de sesión');
        setIsLoading(false);
        return;
      }

      console.log('✅ Login exitoso:', data);

      // Guardar tokens en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('authToken', data.token); // Para compatibilidad con AuthContext
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Actualizar contexto de autenticación
      login(data.user);

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError(err.message || 'Error al iniciar sesión. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className='login-card-container'>

        <img src="/images/natura-icon.png" alt="Natura Icon" className="login-logo" width="250" />

        <div className="login-card">
          <div className="login-header">
            <h1>Bienvenido a Naturacifra</h1>
            <p>Inicia sesión para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Correo electrónico<span className='required'> *</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ingresa tu correo electrónico"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña<span className='required'> *</span></label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  required
                />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Accediendo...' : 'Acceder'}
            </button>

            <p className='reset'>Olvidé mi contraseña, <a href="">recuperar</a>.</p>
          </form>

        </div>
      </div>

      <p className='copy'>Copyright &copy; 2025 Natura Conte Group</p>

    </div>
  );
};

export default Login; 