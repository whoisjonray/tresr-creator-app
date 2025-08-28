// Dynamic Mockups Embedded Editor
// Testing their official embeddable editor to understand functionality

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { initDynamicMockupsIframe } from "@dynamic-mockups/mockup-editor-sdk";
import './DynamicMockupsEmbedded.css';

function DynamicMockupsEmbedded() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [editorMode, setEditorMode] = useState('download');
  const [websiteKey, setWebsiteKey] = useState(''); // Need to get actual website key
  const [mockupUuid, setMockupUuid] = useState(''); // Optional: open specific mockup
  const iframeRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  useEffect(() => {
    // Only initialize once the iframe is loaded and not already initialized
    if (!isInitialized && websiteKey) {
      // Add a delay to ensure iframe is ready
      initTimeoutRef.current = setTimeout(() => {
        initializeEditor();
      }, 1000);
    }
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [editorMode, websiteKey, mockupUuid, isInitialized]);
  
  const initializeEditor = async () => {
    try {
      console.log('🚀 Initializing Dynamic Mockups Editor...');
      console.log('Current domain:', window.location.hostname);
      console.log('Website key:', websiteKey);
      setError(null);
      
      if (!websiteKey) {
        setError('Website key is required. Please enter your Dynamic Mockups website key.');
        setIsLoading(false);
        return;
      }
      
      // Wait for iframe to be fully loaded
      if (!iframeLoaded) {
        console.log('⏳ Waiting for iframe to load...');
        return;
      }
      
      // Initialize using the SDK
      console.log('📦 Calling initDynamicMockupsIframe with:', {
        iframeId: "dm-iframe",
        websiteKey: websiteKey,
        mode: editorMode
      });
      
      initDynamicMockupsIframe({
        iframeId: "dm-iframe",
        data: { 
          "x-website-key": websiteKey
        },
        mode: editorMode
      });
      
      setIsInitialized(true);
      setIsLoading(false);
      console.log('✅ Dynamic Mockups Editor Initialized');
      
      // Check for domain validation errors after initialization
      setTimeout(() => {
        // If still loading after 5 seconds, likely a domain validation issue
        if (isLoading) {
          setError('Domain validation failed. Please ensure creators.tresr.com is whitelisted in Dynamic Mockups and you have the correct website key.');
          setIsLoading(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Failed to initialize Dynamic Mockups:', error);
      setError(error.message || 'Failed to initialize editor');
      setIsLoading(false);
    }
  };
  
  const handleReinitialize = () => {
    setIsInitialized(false);
    setIsLoading(true);
    // Small delay to allow state to update
    setTimeout(() => {
      initializeEditor();
    }, 100);
  };
  
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
            onChange={(e) => {
              setEditorMode(e.target.value);
              handleReinitialize();
            }}
            disabled={!isInitialized}
          >
            <option value="download">Download Mode</option>
            <option value="export">Export Mode</option>
            <option value="preview">Preview Mode</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Website Key: (Required)</label>
          <input 
            type="text" 
            value={websiteKey} 
            onChange={(e) => setWebsiteKey(e.target.value)}
            placeholder="Enter your website key"
          />
          <small>Get this from Dynamic Mockups: Dashboard → Settings → Integrations → Website Keys</small>
        </div>
        
        <div className="control-group">
          <label>Mockup UUID: (Optional)</label>
          <input 
            type="text" 
            value={mockupUuid} 
            onChange={(e) => setMockupUuid(e.target.value)}
            placeholder="Enter mockup UUID to open specific template"
          />
          <small>Leave empty to show all templates</small>
        </div>
        
        <div className="control-group">
          <button 
            className="btn-reinitialize"
            onClick={handleReinitialize}
            disabled={!websiteKey}
          >
            🔄 Reinitialize Editor
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="dm-error-banner">
          <div className="error-content">
            <h3>⚠️ Domain Validation Error</h3>
            <p>{error}</p>
            <div className="error-instructions">
              <h4>To fix this issue:</h4>
              <ol>
                <li>Log into your Dynamic Mockups dashboard</li>
                <li>Go to Settings → API & Integrations</li>
                <li>Add <code>creators.tresr.com</code> to your whitelisted domains</li>
                <li>Also add <code>localhost:3003</code> for local development</li>
                <li>Save changes and refresh this page</li>
              </ol>
              <p className="error-note">
                <strong>Note:</strong> The 403 error indicates that Dynamic Mockups is blocking requests from this domain. 
                Domain whitelisting is required for the embedded editor to work.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
            <li><strong>Domain must be whitelisted in DM settings</strong></li>
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
          ref={iframeRef}
          id="dm-iframe"
          src="https://embed.dynamicmockups.com"
          onLoad={() => {
            console.log('🖼️ Iframe loaded');
            setIframeLoaded(true);
            if (websiteKey && !isInitialized) {
              setTimeout(() => {
                initializeEditor();
              }, 500);
            }
          }}
          style={{
            width: '100%',
            height: '90vh',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          title="Dynamic Mockups Editor"
          allow="camera; microphone"
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