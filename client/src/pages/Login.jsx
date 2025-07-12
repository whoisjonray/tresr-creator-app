import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, creator } = useAuth();

  useEffect(() => {
    // Check if we have a token from Dynamic.xyz callback
    const token = searchParams.get('token');
    if (token) {
      handleLogin(token);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect if already logged in
    if (creator) {
      navigate('/dashboard');
    }
  }, [creator, navigate]);

  const handleLogin = async (token) => {
    const result = await login(token);
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert(result.error || 'Login failed');
    }
  };

  const handleDynamicLogin = () => {
    // Redirect to Dynamic.xyz for authentication
    const authUrl = `https://app.dynamic.xyz/login/b17e8631-c1b7-45d5-95cf-151eb5246423`;
    const redirectUri = `${window.location.origin}/login`;
    const fullUrl = `${authUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = fullUrl;
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-card card">
          <h1>TRESR Creator Tools</h1>
          <p>Login to manage your designs and products</p>
          
          <button 
            className="btn-primary login-btn"
            onClick={handleDynamicLogin}
          >
            Login with Dynamic
          </button>
          
          <p className="login-note">
            You must be an approved creator to access this portal.
          </p>
        </div>
      </div>
      
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .login-card {
          max-width: 400px;
          margin: 0 auto;
          text-align: center;
        }
        
        .login-card h1 {
          margin-bottom: 10px;
        }
        
        .login-card p {
          margin-bottom: 30px;
          color: #666;
        }
        
        .login-btn {
          width: 100%;
          padding: 12px;
          font-size: 16px;
        }
        
        .login-note {
          margin-top: 20px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default Login;