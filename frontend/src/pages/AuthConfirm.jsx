import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const AuthConfirm = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando tu email...');
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    console.log('🔍 Parámetros recibidos:', { type, hasToken: !!accessToken });

    if (type === 'signup' && accessToken && refreshToken) {
      // Email confirmado exitosamente
      setStatus('success');
      setMessage('¡Email confirmado exitosamente!');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else if (type === 'recovery') {
      // Reset de contraseña
      setStatus('success');
      setMessage('Redirigiendo para cambiar contraseña...');
      navigate('/reset-password');
    } else {
      setStatus('error');
      setMessage('Link inválido o expirado');
    }
  }, [navigate]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">
            {status === 'loading' && '⏳'}
            {status === 'success' && '✅'}
            {status === 'error' && '❌'}
          </div>
          <h1>Confirmación de Email</h1>
          <p>{message}</p>
        </div>

        {status === 'loading' && (
          <div className="loading-spinner">
            <p>Verificando...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success-message">
            <p>Serás redirigido al login en unos segundos...</p>
          </div>
        )}

        {status === 'error' && (
          <button onClick={() => navigate('/login')} className="login-button">
            Volver al Login
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthConfirm;
