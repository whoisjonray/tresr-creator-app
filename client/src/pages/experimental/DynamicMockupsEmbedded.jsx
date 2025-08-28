// Dynamic Mockups Embedded Editor
// Testing their official embeddable editor to understand functionality

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initDynamicMockupsIframe } from "@dynamic-mockups/mockup-editor-sdk";
import './DynamicMockupsEmbedded.css';

function DynamicMockupsEmbedded() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [editorMode, setEditorMode] = useState('download');
  const [websiteKey, setWebsiteKey] = useState(''); // We'll need to get this from their dashboard
  
  useEffect(() => {
    // Initialize the Dynamic Mockups iframe
    try {
      initDynamicMockupsIframe({
        iframeId: "dm-iframe",
        data: { 
          "x-website-key": websiteKey || "Qtw1zfUN7ZVJ" // Using the key from instructions
        },
        mode: editorMode,
        onReady: () => {
          console.log('✅ Dynamic Mockups Editor Ready');
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('❌ Dynamic Mockups Editor Error:', error);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Failed to initialize Dynamic Mockups:', error);
      setIsLoading(false);
    }
  }, [editorMode, websiteKey]);
  
  return (
    <div className="dm-embedded-container">
      {/* Header */}
      <div className="dm-embedded-header">
        <div className="header-left">
          <h1>🎨 Dynamic Mockups Embedded Editor</h1>
          <span className="badge-official">Official SDK</span>
        </div>
        <div className="header-right">
          <button 
            className="btn-back"
            onClick={() => navigate('/experimental/compare')}
          >
            ← Back to Comparison
          </button>
        </div>
      </div>
      
      {/* Controls */}
      <div className="dm-embedded-controls">
        <div className="control-group">
          <label>Editor Mode:</label>
          <select 
            value={editorMode} 
            onChange={(e) => setEditorMode(e.target.value)}
          >
            <option value="download">Download Mode</option>
            <option value="export">Export Mode</option>
            <option value="preview">Preview Mode</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Website Key:</label>
          <input 
            type="text" 
            value={websiteKey} 
            onChange={(e) => setWebsiteKey(e.target.value)}
            placeholder="Enter your website key"
          />
          <small>Get this from your Dynamic Mockups dashboard</small>
        </div>
      </div>
      
      {/* Info Panel */}
      <div className="dm-embedded-info">
        <div className="info-card">
          <h3>📋 What This Is</h3>
          <p>This is Dynamic Mockups' official embedded editor using their SDK.</p>
          <ul>
            <li>Full editor functionality in an iframe</li>
            <li>No backend integration needed</li>
            <li>Users can upload, position, and download</li>
            <li>Requires website key from DM dashboard</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>🔍 What to Test</h3>
          <ul>
            <li>Upload your design</li>
            <li>Browse available mockup templates</li>
            <li>Position and scale your design</li>
            <li>Change colors and variations</li>
            <li>Download or export the result</li>
            <li>Check performance and UX</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>💡 Comparison Notes</h3>
          <ul>
            <li><strong>Pros:</strong> Quick setup, maintained by DM, full features</li>
            <li><strong>Cons:</strong> Less control, iframe limitations, branding</li>
            <li><strong>Cost:</strong> Included in your $250/month plan</li>
            <li><strong>Customization:</strong> Limited to their UI/UX</li>
          </ul>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="dm-loading-overlay">
          <div className="spinner"></div>
          <p>Loading Dynamic Mockups Editor...</p>
        </div>
      )}
      
      {/* Dynamic Mockups Iframe */}
      <div className="dm-iframe-container">
        <iframe
          id="dm-iframe"
          src="https://embed.dynamicmockups.com"
          style={{
            width: '100%',
            height: '90vh',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          title="Dynamic Mockups Editor"
        />
      </div>
      
      {/* Footer */}
      <div className="dm-embedded-footer">
        <div className="footer-section">
          <h4>Integration Options</h4>
          <p>This embedded editor can be integrated in multiple ways:</p>
          <ul>
            <li>Standalone page (like this)</li>
            <li>Modal/popup in your design flow</li>
            <li>Part of product creation workflow</li>
            <li>Customer-facing design tool</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>API vs Embedded</h4>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>API Integration</th>
                <th>Embedded Editor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Setup Time</td>
                <td>Days/Weeks</td>
                <td>Minutes</td>
              </tr>
              <tr>
                <td>Customization</td>
                <td>Full control</td>
                <td>Limited</td>
              </tr>
              <tr>
                <td>User Experience</td>
                <td>Native to your app</td>
                <td>Iframe (separate)</td>
              </tr>
              <tr>
                <td>Maintenance</td>
                <td>You maintain</td>
                <td>DM maintains</td>
              </tr>
              <tr>
                <td>Features</td>
                <td>What you build</td>
                <td>All DM features</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DynamicMockupsEmbedded;