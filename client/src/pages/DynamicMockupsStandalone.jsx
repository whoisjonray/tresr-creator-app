// Dynamic Mockups Standalone Embedded Editor
// This is completely outside the auth system for testing

import React, { useEffect, useState, useRef } from 'react';
import { initDynamicMockupsIframe } from "@dynamic-mockups/mockup-editor-sdk";

function DynamicMockupsStandalone() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const iframeRef = useRef(null);
  
  // Get the correct website key based on domain
  const getWebsiteKey = () => {
    const hostname = window.location.hostname;
    
    if (hostname === 'creators.tresr.com') {
      return 'uxRCniavmJbA'; // creators.tresr.com key
    } else if (hostname === 'tresr.com' || hostname === 'www.tresr.com') {
      return 'Qtw1zfUN7ZVJ'; // TRESR.com key
    } else if (hostname.includes('railway.app')) {
      return '18VAujfqJ5iA'; // Railway test domain key
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'uxRCniavmJbA'; // Use creators key for local dev
    }
    
    return 'uxRCniavmJbA'; // Default to creators key
  };
  
  const websiteKey = getWebsiteKey();
  
  // SSR-safe mounting
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Initialize when everything is ready
  useEffect(() => {
    if (isMounted && iframeLoaded && !isInitialized && websiteKey) {
      setTimeout(() => {
        initializeEditor();
      }, 1000);
    }
  }, [isMounted, iframeLoaded, isInitialized]);
  
  const initializeEditor = async () => {
    try {
      console.log('🚀 [STANDALONE] Initializing Dynamic Mockups Editor...');
      console.log('[STANDALONE] Domain:', window.location.hostname);
      console.log('[STANDALONE] Website key:', websiteKey);
      console.log('[STANDALONE] Mounted:', isMounted, 'IFrame loaded:', iframeLoaded);
      
      setError(null);
      
      // Initialize with SDK
      initDynamicMockupsIframe({
        iframeId: "dm-iframe-standalone",
        data: { 
          "x-website-key": websiteKey
        },
        mode: "download"
      });
      
      setIsInitialized(true);
      setIsLoading(false);
      console.log('✅ [STANDALONE] Editor initialized successfully');
      
    } catch (error) {
      console.error('❌ [STANDALONE] Failed to initialize:', error);
      setError(`Initialization failed: ${error.message}`);
      setIsLoading(false);
    }
  };
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Minimal Header */}
      <div style={{ 
        background: '#1a1a1a', 
        color: 'white', 
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #667eea'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            🎨 Dynamic Mockups Editor (Standalone)
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
            Domain: <code>{window.location.hostname}</code> | 
            Key: <code>{websiteKey}</code> | 
            Status: {isInitialized ? '✅ Ready' : isLoading ? '⏳ Loading...' : '❌ Error'}
          </p>
        </div>
        <div>
          <a 
            href="/"
            style={{ 
              color: 'white', 
              textDecoration: 'none',
              padding: '8px 16px',
              background: '#667eea',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            ← Back to App
          </a>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc',
          color: '#c00',
          padding: '15px',
          margin: '10px',
          borderRadius: '4px'
        }}>
          <strong>⚠️ Error:</strong> {error}
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <strong>Troubleshooting:</strong>
            <ol style={{ margin: '5px 0 0 20px', padding: 0 }}>
              <li>Check that <code>{window.location.hostname}</code> is whitelisted</li>
              <li>Verify the website key <code>{websiteKey}</code> is correct</li>
              <li>Ensure no https:// or trailing slash in the whitelist</li>
              <li>Wait 30 seconds after adding domain to whitelist</li>
            </ol>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 1000,
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            width: '40px',
            height: '40px',
            border: '3px solid #667eea',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }} />
          <p style={{ margin: 0, color: '#333' }}>Loading Dynamic Mockups Editor...</p>
        </div>
      )}
      
      {/* Iframe Container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          id="dm-iframe-standalone"
          src="https://embed.dynamicmockups.com"
          onLoad={() => {
            console.log('🖼️ [STANDALONE] Iframe loaded');
            console.log('[STANDALONE] Iframe URL:', iframeRef.current?.src);
            setIframeLoaded(true);
          }}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="Dynamic Mockups Editor Standalone"
          allow="camera; microphone; clipboard-write"
          // No sandbox attribute for maximum compatibility
        />
      </div>
      
      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default DynamicMockupsStandalone;