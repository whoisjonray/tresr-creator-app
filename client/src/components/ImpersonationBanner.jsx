import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ImpersonationBanner.css';

function ImpersonationBanner() {
  const [impersonationData, setImpersonationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkImpersonationStatus();
  }, []);

  const checkImpersonationStatus = async () => {
    try {
      const response = await axios.get('/api/admin/impersonate/status');
      if (response.data.isImpersonating) {
        setImpersonationData(response.data);
      }
    } catch (error) {
      console.error('Failed to check impersonation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopImpersonation = async () => {
    if (!confirm('Stop impersonating this user?')) {
      return;
    }

    try {
      const response = await axios.post('/api/admin/impersonate/stop');
      if (response.data.success) {
        // Reload the page to refresh the session
        window.location.href = '/admin/users';
      }
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
      alert('Failed to stop impersonation');
    }
  };

  if (loading || !impersonationData) {
    return null;
  }

  const timeElapsed = impersonationData.startedAt 
    ? Math.floor((new Date() - new Date(impersonationData.startedAt)) / 60000)
    : 0;

  return (
    <div className="impersonation-banner">
      <div className="impersonation-content">
        <div className="impersonation-info">
          <span className="impersonation-icon">🎭</span>
          <span className="impersonation-text">
            <strong>{impersonationData.originalUser.name || impersonationData.originalUser.email}</strong>
            {' is impersonating '}
            <strong>{impersonationData.targetUser.name || impersonationData.targetUser.email}</strong>
            {timeElapsed > 0 && ` • ${timeElapsed} min`}
          </span>
        </div>
        <button 
          className="stop-impersonation"
          onClick={handleStopImpersonation}
        >
          Stop Impersonating
        </button>
      </div>
    </div>
  );
}

export default ImpersonationBanner;