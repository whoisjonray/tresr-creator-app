import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useAuth } from '../hooks/useAuth';

function Navigation() {
  const location = useLocation();
  const { handleLogOut } = useDynamicContext();
  const { creator, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/design/new', label: 'Create Design' },
    { path: '/products', label: 'Products' },
  ];

  const handleLogout = async () => {
    try {
      // Logout from our app session first
      await logout();
      // Then logout from Dynamic.xyz
      await handleLogOut();
      // Redirect to login page
      window.location.href = 'https://creators.tresr.com/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = 'https://creators.tresr.com/login';
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/dashboard">TRESR Creator</Link>
        </div>
        
        <div className="nav-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-user">
          <span className="user-name">{creator?.name || 'Creator'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <style>{`
        .main-nav {
          background: #fff;
          border-bottom: 1px solid #e0e0e0;
          padding: 0 20px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          height: 64px;
        }

        .nav-brand a {
          font-size: 20px;
          font-weight: 600;
          text-decoration: none;
          color: #333;
        }

        .nav-menu {
          display: flex;
          gap: 30px;
        }

        .nav-link {
          text-decoration: none;
          color: #666;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .nav-link:hover,
        .nav-link.active {
          color: #333;
          background: #f5f5f5;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-name {
          color: #666;
          font-size: 14px;
        }

        .logout-btn {
          background: none;
          border: 1px solid #ddd;
          padding: 6px 12px;
          border-radius: 4px;
          color: #666;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #f5f5f5;
          border-color: #ccc;
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0 15px;
          }
          
          .nav-menu {
            gap: 15px;
          }
          
          .nav-link {
            padding: 6px 12px;
            font-size: 14px;
          }
          
          .user-name {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navigation;