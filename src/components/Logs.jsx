import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Logs.css';

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
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // For demo purposes, accept any email/password combination
      if (formData.email && formData.password) {
        login({
          id: 1,
          email: formData.email,
          name: formData.email.split('@')[0]
        });
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className='login-card-container'>

        <img src="./public/images/natura-icon.png" alt="Natura Icon" className="login-logo" width="250" />

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

          <div className="login-footer">
            <p>Demo: Use any email and password to login</p>
          </div>
        </div>
      </div>

      <p className='copy'>Copyright &copy; 2025 Natura Conte Group</p>

    </div>
  );
};

export default Login; 