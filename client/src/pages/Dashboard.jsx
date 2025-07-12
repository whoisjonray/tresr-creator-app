import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

function Dashboard() {
  const { creator, logout } = useAuth();
  const { handleLogOut } = useDynamicContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/creators/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <h1 className="page-title">Creator Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="welcome-section">
          <h2>Welcome back, {creator?.name || 'Creator'}!</h2>
        </div>

        <div className="stats-grid grid grid-4">
          <div className="stat-card card">
            <div className="stat-value">{stats?.totalProducts || 0}</div>
            <div className="stat-label">Total Products</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">${(stats?.totalSales || 0).toFixed(2)}</div>
            <div className="stat-label">Total Sales</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">${(stats?.commissionEarned || 0).toFixed(2)}</div>
            <div className="stat-label">Commission Earned</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats?.totalOrders || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>

        <div className="actions-section">
          <h3>Quick Actions</h3>
          <div className="actions-grid grid grid-3">
            <Link to="/design/new" className="action-card card">
              <h4>Create New Design</h4>
              <p>Upload artwork and create products</p>
            </Link>
            <Link to="/products" className="action-card card">
              <h4>Manage Products</h4>
              <p>View and edit your existing products</p>
            </Link>
            <div className="action-card card disabled">
              <h4>View Analytics</h4>
              <p>Coming soon</p>
            </div>
          </div>
        </div>

        {stats?.topProducts?.length > 0 && (
          <div className="top-products-section">
            <h3>Top Products</h3>
            <div className="card">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.title}</td>
                      <td>{product.quantity}</td>
                      <td>${product.sales.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-section {
          margin-bottom: 30px;
        }

        .stat-card {
          text-align: center;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .actions-section {
          margin: 40px 0;
        }

        .actions-section h3,
        .top-products-section h3 {
          margin-bottom: 20px;
        }

        .action-card {
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s;
          cursor: pointer;
        }

        .action-card:hover:not(.disabled) {
          transform: translateY(-2px);
        }

        .action-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-card h4 {
          margin-bottom: 8px;
          color: #333;
        }

        .action-card p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
        }

        .products-table th,
        .products-table td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }

        .products-table th {
          font-weight: 600;
          color: #666;
          font-size: 14px;
        }

        .products-table tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;