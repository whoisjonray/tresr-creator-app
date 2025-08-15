import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
    checkImpersonationStatus();
  }, []);

  const loadUsers = async (query = '') => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/impersonate/users/search', {
        params: { query }
      });
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const checkImpersonationStatus = async () => {
    try {
      const response = await axios.get('/api/admin/impersonate/status');
      setImpersonating(response.data.isImpersonating);
    } catch (error) {
      console.error('Failed to check impersonation status:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers(searchQuery);
  };

  const handleImpersonate = async (userId) => {
    if (!confirm('Are you sure you want to impersonate this user?')) {
      return;
    }

    try {
      const response = await axios.post(`/api/admin/impersonate/start/${userId}`);
      if (response.data.success) {
        alert(`Now impersonating ${response.data.impersonation.targetUser.email}`);
        // Reload the page to refresh the session
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      alert(error.response?.data?.error || 'Failed to impersonate user');
    }
  };

  const handleStopImpersonation = async () => {
    try {
      const response = await axios.post('/api/admin/impersonate/stop');
      if (response.data.success) {
        alert('Stopped impersonating');
        window.location.href = '/admin/users';
      }
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
      alert('Failed to stop impersonation');
    }
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>User Management</h1>
        {impersonating && (
          <button 
            className="stop-impersonation-btn"
            onClick={handleStopImpersonation}
          >
            Stop Impersonating
          </button>
        )}
      </div>

      <div className="search-section">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by email, name, or Dynamic ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>
      </div>

      <div className="users-grid">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="no-users">No users found</div>
        ) : (
          users.map(user => (
            <div key={user.dynamicId} className="user-card">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h3>{user.name || 'No Name'}</h3>
                <p className="user-email">{user.email}</p>
                <p className="user-id">ID: {user.dynamicId}</p>
                <p className="user-meta">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
                {user.lastImpersonatedAt && (
                  <p className="impersonation-history">
                    Last impersonated: {new Date(user.lastImpersonatedAt).toLocaleDateString()}
                    {user.lastImpersonatedBy && ` by ${user.lastImpersonatedBy}`}
                  </p>
                )}
              </div>
              <button 
                className="impersonate-btn"
                onClick={() => handleImpersonate(user.dynamicId)}
              >
                Login As User
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserManagement;