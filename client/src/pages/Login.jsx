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
    console.log('Login useEffect triggered');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('creator:', creator);
    
    // Handle Dynamic.xyz authentication
    if (isAuthenticated && user && !creator) {
      console.log('Conditions met, calling handleDynamicAuth');
      handleDynamicAuth();
    } else {
      console.log('Conditions not met for auth');
    }
  }, [isAuthenticated, user, creator]);

  const handleDynamicAuth = async () => {
    try {
      console.log('Starting Dynamic auth process...');
      console.log('User object:', user);
      
      // Get the JWT token from Dynamic
      const token = await user.getJWT();
      console.log('Got JWT token:', token ? 'Yes' : 'No');
      
      if (token) {
        console.log('Calling login with token...');
        // Exchange Dynamic JWT for our app session
        const result = await login(token);
        console.log('Login result:', result);
        
        if (result.success) {
          console.log('Login successful, redirecting...');
          // Add a small delay to ensure session is saved
          setTimeout(() => {
            window.location.href = 'https://creators.tresr.com/dashboard';
          }, 500);
        } else {
          console.error('Login failed:', result.error);
          alert(result.error || 'Creator access denied. Please ensure you have creator permissions.');
          // Log out from Dynamic if app login fails
          await handleLogOut();
        }
      } else {
        console.error('No JWT token received from Dynamic');
        alert('Failed to get authentication token');
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
      <div className="debug-nav">
        <button onClick={async () => {
          try {
            if (creator) {
              await logout();
            }
            await handleLogOut();
            // Clear any local storage
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          } catch (error) {
            console.error('Logout error:', error);
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }
        }} className="btn-secondary">
          Force Logout & Reset
        </button>
        {creator && (
          <button onClick={() => window.location.href = 'https://creators.tresr.com/dashboard'} className="btn-primary">
            Go to Dashboard
          </button>
        )}
        {isAuthenticated && !creator && (
          <div>
            <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
              Dynamic.xyz authenticated but no creator session
            </p>
            <button onClick={handleDynamicAuth} className="btn-primary" style={{ marginTop: '10px' }}>
              Manual Auth Test
            </button>
          </div>
        )}
      </div>
      
      <div className="container">
        <div className="login-card card">
          <h1>🚨 TRESR Creator Tools - TEST BUILD 🚨</h1>
          <p style={{ fontSize: '16px', color: 'red', fontWeight: 'bold' }}>⚠️ DEBUG MODE ACTIVE - BUILD v2.0 ⚠️</p>
          <p>Login to manage your designs and products</p>
          
          {!isAuthenticated ? (
            <DynamicConnectButton>
              <button className="btn-primary login-btn">
                Login or Create Account
              </button>
            </DynamicConnectButton>
          ) : !creator ? (
            <div className="authenticating">
              <p>Verifying creator access...</p>
              <button 
                onClick={async () => {
                  await handleLogOut();
                  window.location.reload();
                }} 
                className="btn-secondary"
                style={{ marginTop: '20px' }}
              >
                Start Over (Logout)
              </button>
            </div>
          ) : (
            <div className="authenticated">
              <p>✅ Logged in as {creator.name}</p>
              <button onClick={() => navigate('/dashboard')} className="btn-primary">
                Go to Dashboard
              </button>
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