import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useAuth } from '../hooks/useAuth';

function AuthGuard({ children }) {
  const location = useLocation();
  const { isAuthenticated, user } = useDynamicContext();
  const { creator, login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Allow access to login page without authentication
  const isLoginPage = location.pathname === '/login';
  
  useEffect(() => {
    // If we're on the login page, no need to check auth
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    // If we have a creator session, we're good - stop here
    if (creator) {
      setIsLoading(false);
      return;
    }

    // Otherwise, redirect to login and let login handle Dynamic.xyz auth
    setIsLoading(false);
  }, [creator, isLoginPage]);

  const handleDynamicAuth = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      let token;
      
      try {
        // Try to get JWT token from Dynamic
        token = await user.getJWT();
      } catch (jwtError) {
        console.log('JWT not available, creating custom token');
        // If JWT not available, create custom JSON token (newer SDK compatibility)
        token = JSON.stringify({
          sub: user.userId,
          email: user.email,
          sessionId: user.sessionId,
          name: user.firstName || user.email?.split('@')[0] || 'Creator'
        });
      }
      
      if (token) {
        // Exchange Dynamic token for our app session
        const result = await login(token);
        if (result.success) {
          // Success - creator session established
          setIsLoading(false);
        } else {
          setAuthError(result.error || 'Creator access denied. Please ensure you have creator permissions.');
          setIsLoading(false);
        }
      } else {
        setAuthError('Failed to get authentication token');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
        
        <style>{`
          .auth-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 20px;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #333;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show auth error if there is one
  if (authError) {
    return (
      <div className="auth-error">
        <div className="error-card">
          <h2>Authentication Error</h2>
          <p>{authError}</p>
          <a href="/login" className="btn-primary">
            Try Again
          </a>
        </div>
        
        <style>{`
          .auth-error {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          
          .error-card {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          
          .error-card h2 {
            color: #e74c3c;
            margin-bottom: 20px;
          }
          
          .error-card p {
            color: #666;
            margin-bottom: 30px;
          }
          
          .btn-primary {
            background: #333;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
          }
        `}</style>
      </div>
    );
  }

  // If not on login page and no creator session, redirect to login
  // But give Dynamic.xyz auth a chance to complete first
  if (!isLoginPage && !creator && !isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }
  
  // If Dynamic.xyz is authenticated but no creator session yet, show loading
  if (!isLoginPage && !creator && isAuthenticated) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Setting up your creator account...</p>
        
        <style>{`
          .auth-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 20px;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #333;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // All good, render the protected content
  return children;
}

export default AuthGuard;