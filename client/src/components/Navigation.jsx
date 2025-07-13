import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useAuth } from '../hooks/useAuth';
import { logos, colors, typography, spacing, transitions } from '../styles/tresr-design-system';

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
          <Link to="/dashboard" className="brand-link">
            <img 
              src={logos.horizontal.black}
              alt="TRESR Creator"
              className="logo-desktop"
            />
            <img 
              src={logos.diamond.gold}
              alt="TRESR"
              className="logo-mobile"
            />
          </Link>
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
          background: ${colors.offWhite};
          border-bottom: 1px solid ${colors.gray};
          padding: 0 ${spacing[5]};
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: ${typography.fontFamily.sans};
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: ${spacing.section};
          margin: 0 auto;
          height: 70px;
        }

        .brand-link {
          display: flex;
          align-items: center;
        }

        .logo-desktop {
          height: 40px;
          width: auto;
        }

        .logo-mobile {
          height: 36px;
          width: auto;
          display: none;
        }

        .nav-menu {
          display: flex;
          gap: ${spacing[2]};
        }

        .nav-link {
          text-decoration: none;
          color: ${colors.bodyDarkGray};
          font-weight: ${typography.fontWeight.medium};
          font-size: ${typography.fontSize.sm};
          padding: ${spacing[2]} ${spacing[4]};
          border-radius: ${spacing[2]};
          transition: ${transitions.DEFAULT};
          position: relative;
        }

        .nav-link:hover {
          color: ${colors.textBlack};
          background: rgba(8, 15, 32, 0.05);
        }

        .nav-link.active {
          color: ${colors.textBlack};
          background: rgba(8, 15, 32, 0.05);
          font-weight: ${typography.fontWeight.semibold};
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: ${spacing[4]};
          right: ${spacing[4]};
          height: 2px;
          background: ${colors.brand};
          border-radius: 2px 2px 0 0;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: ${spacing[4]};
        }

        .user-name {
          color: ${colors.bodyGray};
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.medium};
        }

        .logout-btn {
          background: transparent;
          border: 2px solid ${colors.gray};
          padding: ${spacing[2]} ${spacing[4]};
          border-radius: 32px;
          color: ${colors.darkGray};
          font-size: ${typography.fontSize.sm};
          font-weight: ${typography.fontWeight.medium};
          font-family: ${typography.fontFamily.jost};
          text-transform: uppercase;
          letter-spacing: ${typography.letterSpacing.wide};
          cursor: pointer;
          transition: ${transitions.DEFAULT};
          height: 36px;
          display: inline-flex;
          align-items: center;
        }

        .logout-btn:hover {
          background: ${colors.lightGray};
          border-color: ${colors.darkGray};
          color: ${colors.textBlack};
          transform: translateY(1px);
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0 ${spacing[4]};
            height: 60px;
          }
          
          .logo-desktop {
            display: none;
          }
          
          .logo-mobile {
            display: block;
          }
          
          .nav-menu {
            gap: ${spacing[1]};
          }
          
          .nav-link {
            padding: ${spacing[2]} ${spacing[3]};
            font-size: ${typography.fontSize.xs};
          }
          
          .user-name {
            display: none;
          }
          
          .logout-btn {
            padding: ${spacing[1]} ${spacing[3]};
            font-size: ${typography.fontSize.xs};
            height: 32px;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navigation;