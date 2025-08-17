import React, { useState } from 'react';
import axios from 'axios';

function TestThumbnailFix() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageStatus, setImageStatus] = useState(null);

  const checkImageStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/fix/image-status');
      setImageStatus(response.data);
    } catch (error) {
      console.error('Error checking image status:', error);
      setImageStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fixMissingThumbnails = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/fix/fix-missing-thumbnails');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fixing thumbnails:', error);
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Thumbnail Fix Tool</h1>
      <p>This tool helps diagnose and fix missing thumbnail images for imported designs.</p>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Step 1: Check Image Status</h2>
        <button 
          onClick={checkImageStatus}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Checking...' : 'Check Image Status'}
        </button>
        
        {imageStatus && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: '#f8f9fa', 
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}>
            <h3>Image Status Results:</h3>
            {imageStatus.error ? (
              <p style={{ color: 'red' }}>Error: {imageStatus.error}</p>
            ) : (
              <>
                <p><strong>Total Designs:</strong> {imageStatus.stats?.total || 0}</p>
                <p><strong>With Images:</strong> {imageStatus.stats?.withImages || 0}</p>
                <p><strong>Without Images:</strong> {imageStatus.stats?.withoutImages || 0}</p>
                
                {imageStatus.withoutImages?.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <h4>Designs needing fixes:</h4>
                    <ul>
                      {imageStatus.withoutImages.slice(0, 5).map(design => (
                        <li key={design.id}>
                          {design.name} (ID: {design.id?.substring(0, 8)}...)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Step 2: Fix Missing Thumbnails</h2>
        <button 
          onClick={fixMissingThumbnails}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Fixing...' : 'Fix Missing Thumbnails'}
        </button>
        
        {status && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: status.error ? '#f8d7da' : '#d4edda', 
            border: `1px solid ${status.error ? '#f5c6cb' : '#c3e6cb'}`,
            borderRadius: '4px'
          }}>
            <h3>Fix Results:</h3>
            {status.error ? (
              <p style={{ color: 'red' }}>Error: {status.error}</p>
            ) : (
              <>
                <p style={{ color: 'green' }}>{status.message}</p>
                {status.stats && (
                  <>
                    <p><strong>Total Found:</strong> {status.stats.totalFound}</p>
                    <p><strong>Fixed:</strong> {status.stats.fixed}</p>
                    <p><strong>Errors:</strong> {status.stats.errors}</p>
                  </>
                )}
                
                {status.errors?.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <h4>Errors encountered:</h4>
                    <ul>
                      {status.errors.map((error, index) => (
                        <li key={index}>
                          <strong>{error.design}:</strong> {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '4px'
      }}>
        <h3>How This Works:</h3>
        <ol>
          <li><strong>Check Status:</strong> Scans the database to find designs with missing thumbnail URLs</li>
          <li><strong>Fix Thumbnails:</strong> For each design with missing images, fetches fresh data from Sanity and updates the database</li>
          <li><strong>Results:</strong> Shows how many designs were successfully fixed and any errors encountered</li>
        </ol>
        
        <p><strong>Note:</strong> This fix only works for designs that have been imported from Sanity and have valid Sanity IDs.</p>
      </div>
    </div>
  );
}

export default TestThumbnailFix;