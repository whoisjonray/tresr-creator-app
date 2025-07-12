import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDynamicContext, DynamicConnectButton } from '@dynamic-labs/sdk-react-core';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const navigate = useNavigate();
  const { login, logout, creator } = useAuth();
  const { user, isAuthenticated, handleLogOut, primaryWallet } = useDynamicContext();

  useEffect(() => {
    // Redirect if already logged in via our app
    if (creator) {
      navigate('/dashboard');
    }
  }, [creator, navigate]);

  useEffect(() => {
    // Handle Dynamic.xyz authentication
    if (isAuthenticated && user) {
      handleDynamicAuth();
    }
  }, [isAuthenticated, user]);

  const handleDynamicAuth = async () => {
    try {
      // Get the JWT token from Dynamic
      const token = await user.getJWT();
      
      if (token) {
        // Exchange Dynamic JWT for our app session
        const result = await login(token);
        if (result.success) {
          // Redirect to dashboard after successful login
          window.location.href = 'https://creators.tresr.com/dashboard';
        } else {
          alert(result.error || 'Creator access denied. Please ensure you have creator permissions.');
          // Log out from Dynamic if app login fails
          await handleLogOut();
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
      await handleLogOut();
    }
  };

  return (
    <div className="login-page">
      {/* Debug nav for testing */}
      {(isAuthenticated || creator) && (
        <div className="debug-nav">
          <button onClick={async () => {
            try {
              if (creator) {
                await logout();
              }
              await handleLogOut();
              window.location.reload();
            } catch (error) {
              console.error('Logout error:', error);
              window.location.reload();
            }
          }} className="btn-secondary">
            Logout
          </button>
          {creator && (
            <button onClick={() => window.location.href = 'https://creators.tresr.com/dashboard'} className="btn-primary">
              Go to Dashboard
            </button>
          )}
        </div>
      )}
      
      <div className="container">
        <div className="login-card card">
          <h1>TRESR Creator Tools</h1>
          <p>Login to manage your designs and products</p>
          
          {!isAuthenticated ? (
            <DynamicConnectButton>
              <button className="btn-primary login-btn">
                Login or Create Account
              </button>
            </DynamicConnectButton>
          ) : (
            <div className="authenticating">
              <p>Verifying creator access...</p>
            </div>
          )}
          
          <p className="login-note">
            You must be an approved creator to access this portal.
          </p>
        </div>
      </div>
      
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .debug-nav {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 1000;
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
        
        .authenticating {
          text-align: center;
          padding: 20px;
        }
        
        .authenticating p {
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

export default Login;