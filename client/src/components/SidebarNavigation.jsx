import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useAuth } from '../hooks/useAuth';

function SidebarNavigation() {
  const location = useLocation();
  const { handleLogOut } = useDynamicContext();
  const { creator, logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState(['main', 'docs']);

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const navSections = [
    {
      id: 'main',
      title: 'Main',
      icon: '🏠',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/design/new', label: 'Create Design', icon: '🎨' },
        { path: '/products', label: 'Products', icon: '📦' },
        { path: '/analytics', label: 'Analytics', icon: '📈' },
      ]
    },
    {
      id: 'docs',
      title: 'Documentation',
      icon: '📚',
      items: [
        { path: '/docs/getting-started', label: 'Getting Started', icon: '🚀' },
        { path: '/docs/print-guidelines', label: 'Print Guidelines', icon: '🖨️' },
        { path: '/docs/design-tools', label: 'Design Tools', icon: '🛠️' },
        { path: '/docs/faq', label: 'FAQ', icon: '❓' },
      ]
    },
    {
      id: 'account',
      title: 'Account',
      icon: '👤',
      items: [
        { path: '/account/profile', label: 'Profile', icon: '👤' },
        { path: '/account/settings', label: 'Settings', icon: '⚙️' },
        { path: '/account/billing', label: 'Billing', icon: '💳' },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      await handleLogOut();
      window.location.href = 'https://creators.tresr.com/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = 'https://creators.tresr.com/login';
    }
  };

  return (
    <>
      <div className="sidebar-navigation">
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <img src="/logo.png" alt="TRESR" className="brand-logo" />
            <span>TRESR Creator</span>
          </Link>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {creator?.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div className="user-info">
            <div className="user-name">{creator?.name || 'Creator'}</div>
            <div className="user-email">{creator?.email || ''}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.id} className="nav-section">
              <button
                className="section-header"
                onClick={() => toggleSection(section.id)}
                aria-expanded={expandedSections.includes(section.id)}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-title">{section.title}</span>
                <span className="section-arrow">
                  {expandedSections.includes(section.id) ? '▼' : '▶'}
                </span>
              </button>
              
              {expandedSections.includes(section.id) && (
                <div className="section-items">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <style>{`
        .sidebar-navigation {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 280px;
          background: #1a1a1a;
          color: #fff;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          z-index: 100;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #333;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #fff;
          font-size: 20px;
          font-weight: 600;
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          border-radius: 6px;
        }

        .sidebar-user {
          padding: 20px;
          border-bottom: 1px solid #333;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: #00c896;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }

        .user-info {
          flex: 1;
          overflow: hidden;
        }

        .user-name {
          font-weight: 500;
          margin-bottom: 2px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .user-email {
          font-size: 12px;
          color: #999;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 0;
        }

        .nav-section {
          margin-bottom: 8px;
        }

        .section-header {
          width: 100%;
          padding: 12px 20px;
          background: none;
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
          font-size: 14px;
          font-weight: 500;
        }

        .section-header:hover {
          background: #2a2a2a;
        }

        .section-icon {
          font-size: 18px;
          width: 24px;
          text-align: center;
        }

        .section-title {
          flex: 1;
        }

        .section-arrow {
          font-size: 12px;
          color: #666;
          transition: transform 0.2s;
        }

        .section-items {
          background: #0a0a0a;
          padding: 8px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px 10px 44px;
          color: #ccc;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s;
          position: relative;
        }

        .nav-item:hover {
          color: #fff;
          background: #1a1a1a;
        }

        .nav-item.active {
          color: #00c896;
          background: #1a1a1a;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #00c896;
        }

        .item-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }

        .item-label {
          flex: 1;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid #333;
          margin-top: auto;
        }

        .logout-btn {
          width: 100%;
          padding: 12px;
          background: #2a2a2a;
          border: 1px solid #333;
          color: #fff;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .logout-btn:hover {
          background: #333;
          border-color: #444;
        }

        .logout-icon {
          font-size: 16px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .sidebar-navigation {
            transform: translateX(-100%);
            transition: transform 0.3s;
          }

          .sidebar-navigation.open {
            transform: translateX(0);
          }
        }

        /* Adjust main content to account for sidebar */
        body.has-sidebar {
          padding-left: 280px;
        }

        @media (max-width: 768px) {
          body.has-sidebar {
            padding-left: 0;
          }
        }
      `}</style>
    </>
  );
}

export default SidebarNavigation;