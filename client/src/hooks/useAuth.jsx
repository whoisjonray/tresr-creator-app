import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);
  
  // Expose creator info globally for userStorage
  useEffect(() => {
    if (creator) {
      window.__TRESR_SESSION_CREATOR__ = creator;
      window.__TRESR_AUTH_CONTEXT__ = { creator };
    } else {
      window.__TRESR_SESSION_CREATOR__ = null;
      window.__TRESR_AUTH_CONTEXT__ = null;
    }
  }, [creator]);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data.success) {
        setCreator(response.data.creator);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token) => {
    try {
      console.log('Sending auth request with token length:', token?.length);
      console.log('Token preview:', token?.substring(0, 100) + '...');
      const response = await api.post('/api/auth/verify', { token });
      if (response.data.success) {
        setCreator(response.data.creator);
        return { success: true };
      }
    } catch (error) {
      console.error('Login failed:', error);
      console.error('Response data:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
      setCreator(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    creator,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};