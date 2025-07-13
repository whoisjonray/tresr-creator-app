import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DesignEditor from './pages/DesignEditor';
import ProductManager from './pages/ProductManager';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import PrintGuidelines from './pages/PrintGuidelines';
import Navigation from './components/Navigation';
import SidebarNavigation from './components/SidebarNavigation';
import AuthGuard from './components/AuthGuard';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataMigration } from './components/DataMigration';
import DynamicProvider from './providers/DynamicProvider';
import './App.css';

function AppContent() {
  const { creator } = useAuth();
  const [useSidebar, setUseSidebar] = React.useState(true);

  useEffect(() => {
    // Add class to body for sidebar layout
    if (useSidebar && creator) {
      document.body.classList.add('has-sidebar');
    } else {
      document.body.classList.remove('has-sidebar');
    }
    
    return () => {
      document.body.classList.remove('has-sidebar');
    };
  }, [useSidebar, creator]);

  return (
    <Router>
      <Routes>
        {/* Public route - outside AuthGuard */}
        <Route path="/print-guidelines" element={<PrintGuidelines />} />
        
        {/* Protected routes - inside AuthGuard */}
        <Route path="/*" element={
          <AuthGuard>
            <DataMigration>
              <div className="app">
                {creator && useSidebar && <SidebarNavigation />}
                {creator && !useSidebar && <Navigation />}
                <div className="main-content">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/design/new" element={<DesignEditor />} />
                    <Route path="/design/:id/edit" element={<DesignEditor />} />
                    <Route path="/products" element={<ProductManager />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    
                    {/* Documentation Routes */}
                    <Route path="/docs/getting-started" element={<div>Getting Started Guide (Coming Soon)</div>} />
                    <Route path="/docs/print-guidelines" element={<PrintGuidelines />} />
                    <Route path="/docs/design-tools" element={<PrintGuidelines />} />
                    <Route path="/docs/faq" element={<div>FAQ (Coming Soon)</div>} />
                    
                    {/* Account Routes */}
                    <Route path="/account/profile" element={<div>Profile (Coming Soon)</div>} />
                    <Route path="/account/settings" element={<div>Settings (Coming Soon)</div>} />
                    <Route path="/account/billing" element={<div>Billing (Coming Soon)</div>} />
                    
                    {/* Analytics Route */}
                    <Route path="/analytics" element={<div>Analytics (Coming Soon)</div>} />
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </div>
            </DataMigration>
          </AuthGuard>
        } />
      </Routes>
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