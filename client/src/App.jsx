import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DesignEditor from './pages/DesignEditor';
import ProductManager from './pages/ProductManager';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Navigation from './components/Navigation';
import AuthGuard from './components/AuthGuard';
import { AuthProvider, useAuth } from './hooks/useAuth';
import DynamicProvider from './providers/DynamicProvider';
import './App.css';

function AppContent() {
  const { creator } = useAuth();

  return (
    <Router>
      <AuthGuard>
        <div className="app">
          {creator && <Navigation />}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/design/new" element={<DesignEditor />} />
            <Route path="/design/:id/edit" element={<DesignEditor />} />
            <Route path="/products" element={<ProductManager />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthGuard>
    </Router>
  );
}

function App() {
  return (
    <DynamicProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DynamicProvider>
  );
}

export default App;