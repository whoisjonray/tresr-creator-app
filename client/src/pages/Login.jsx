import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDynamicContext, DynamicConnectButton } from '@dynamic-labs/sdk-react-core';
import { useAuth } from '../hooks/useAuth';
import { logos, colors, typography, spacing, transitions, shadows, borderRadius } from '../styles/tresr-design-system';

console.log('🔥 Login.jsx file loaded at:', new Date().toISOString());

function Login() {
  console.log('🔥 Login component rendering');
  const navigate = useNavigate();
  const { login, logout, creator } = useAuth();
  const { user, isAuthenticated, handleLogOut, primaryWallet, authToken, getAuthToken } = useDynamicContext();

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
    // Only trigger auth if no creator session exists and user is available
    if (user && user.userId && !creator) {
      console.log('Conditions met, calling handleDynamicAuth');
      handleDynamicAuth();
    } else {
      console.log('Conditions not met for auth');
      console.log('  - user.userId:', user?.userId);
      console.log('  - creator exists:', !!creator);
      if (creator) {
        console.log('Creator already exists, skipping auth');
      }
    }
  }, [isAuthenticated, user, creator]);

  const handleDynamicAuth = async () => {
    try {
      console.log('Starting Dynamic auth process...');
      console.log('User object:', user);
      console.log('User methods:', Object.getOwnPropertyNames(user));
      
      // Get the JWT token from Dynamic - try different methods
      let token;
      try {
        // Try getAuthToken function from Dynamic context
        if (typeof getAuthToken === 'function') {
          token = await getAuthToken();
          console.log('Using getAuthToken() from Dynamic context');
        } else if (authToken) {
          token = authToken;
          console.log('Using authToken from Dynamic context');
        } else if (user.sessionId) {
          // For newer Dynamic SDK, we might need to create a simple session token
          // Since the user object has userId, sessionId, email, etc., we can create our own token
          token = JSON.stringify({
            sub: user.userId,
            email: user.email,
            alias: user.alias || user.firstName,
            sessionId: user.sessionId,
            verifiedCredentials: user.verifiedCredentials
          });
          console.log('Creating custom token from user data');
          console.log('Token data:', {
            sub: user.userId,
            email: user.email,
            alias: user.alias || user.firstName,
            sessionId: user.sessionId,
            verifiedCredentials: user.verifiedCredentials
          });
        } else {
          console.error('No JWT method available');
          console.log('Available Dynamic context methods:', typeof getAuthToken);
          console.log('authToken:', authToken);
          console.log('User has sessionId:', !!user.sessionId);
          throw new Error('JWT token method not available');
        }
      } catch (jwtError) {
        console.error('JWT retrieval error:', jwtError);
        throw jwtError;
      }
      
      console.log('Got JWT token:', token ? 'Yes' : 'No');
      
      if (token) {
        console.log('Calling login with token...');
        // Exchange Dynamic JWT for our app session
        const result = await login(token);
        console.log('Login result:', result);
        
        if (result.success) {
          console.log('Login successful, redirecting...');
          // Don't redirect if already authenticated - let the useEffect handle it
          // The useAuth context will update and trigger navigation
          return;
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
          <div className="logo-container">
            <img 
              src={logos.vertical.black}
              alt="TRESR"
              className="login-logo"
            />
          </div>
          <h1>Creator Portal</h1>
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
          background: ${colors.bgLightBlue};
          font-family: ${typography.fontFamily.sans};
        }
        
        .debug-nav {
          position: fixed;
          top: ${spacing[5]};
          right: ${spacing[5]};
          display: flex;
          gap: ${spacing[3]};
          z-index: 1000;
        }
        
        .debug-nav .btn-secondary,
        .debug-nav .btn-primary {
          font-size: ${typography.fontSize.xs};
          padding: ${spacing[2]} ${spacing[3]};
          height: 32px;
        }
        
        .container {
          width: 100%;
          max-width: 480px;
          padding: ${spacing[5]};
        }
        
        .login-card {
          background: ${colors.offWhite};
          padding: ${spacing[10]};
          border-radius: ${borderRadius.xl};
          box-shadow: ${shadows.lg};
          text-align: center;
        }
        
        .logo-container {
          margin-bottom: ${spacing[8]};
        }
        
        .login-logo {
          height: 80px;
          width: auto;
        }
        
        .login-card h1 {
          font-size: ${typography.fontSize['2xl']};
          font-weight: ${typography.fontWeight.bold};
          color: ${colors.textBlack};
          margin-bottom: ${spacing[3]};
          font-family: ${typography.fontFamily.jost};
          letter-spacing: ${typography.letterSpacing.tight};
        }
        
        .login-card p {
          font-size: ${typography.fontSize.base};
          color: ${colors.bodyGray};
          margin-bottom: ${spacing[8]};
          line-height: ${typography.lineHeight.relaxed};
        }
        
        .login-btn {
          width: 100%;
          background: ${colors.brand};
          color: ${colors.textBlack};
          border: 2px solid ${colors.brand};
          border-radius: 32px;
          padding: ${spacing[3]} ${spacing[6]};
          font-size: ${typography.fontSize.base};
          font-weight: ${typography.fontWeight.bold};
          font-family: ${typography.fontFamily.jost};
          text-transform: uppercase;
          letter-spacing: ${typography.letterSpacing.wide};
          cursor: pointer;
          transition: ${transitions.DEFAULT};
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .login-btn:hover {
          border-color: ${colors.accentOrange};
          transform: translateY(-1px);
          box-shadow: ${shadows.md};
        }
        
        .login-btn:active {
          transform: translateY(0);
          box-shadow: ${shadows.sm};
        }
        
        .btn-primary {
          background: ${colors.brand};
          color: ${colors.textBlack};
          border: 2px solid ${colors.brand};
          border-radius: 32px;
          padding: ${spacing[2]} ${spacing[5]};
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.bold};
          font-family: ${typography.fontFamily.jost};
          text-transform: uppercase;
          letter-spacing: ${typography.letterSpacing.wide};
          cursor: pointer;
          transition: ${transitions.DEFAULT};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-primary:hover {
          border-color: ${colors.accentOrange};
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background: transparent;
          color: ${colors.darkGray};
          border: 2px solid ${colors.gray};
          border-radius: 32px;
          padding: ${spacing[2]} ${spacing[5]};
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.medium};
          font-family: ${typography.fontFamily.jost};
          text-transform: uppercase;
          letter-spacing: ${typography.letterSpacing.wide};
          cursor: pointer;
          transition: ${transitions.DEFAULT};
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-secondary:hover {
          background: ${colors.lightGray};
          border-color: ${colors.darkGray};
          color: ${colors.textBlack};
        }
        
        .login-note {
          margin-top: ${spacing[6]};
          font-size: ${typography.fontSize.sm};
          color: ${colors.bodyGray};
        }
        
        .authenticating {
          text-align: center;
          padding: ${spacing[5]};
        }
        
        .authenticating p {
          color: ${colors.bodyGray};
          font-style: italic;
          margin-bottom: ${spacing[4]};
        }
        
        .authenticated {
          text-align: center;
        }
        
        .authenticated p {
          color: ${colors.success};
          font-weight: ${typography.fontWeight.medium};
          margin-bottom: ${spacing[4]};
        }
        
        @media (max-width: 640px) {
          .container {
            padding: ${spacing[4]};
          }
          
          .login-card {
            padding: ${spacing[8]} ${spacing[6]};
          }
          
          .login-logo {
            height: 60px;
          }
          
          .login-card h1 {
            font-size: ${typography.fontSize.xl};
          }
        }
      `}</style>
    </div>
  );
}

export default Login;