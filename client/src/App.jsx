import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DesignEditor from './pages/DesignEditor';
import ProductManager from './pages/ProductManager';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import { AuthProvider } from './hooks/useAuth';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
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
      </Router>
    </AuthProvider>
  );
}

export default App;