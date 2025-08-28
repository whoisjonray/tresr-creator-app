// Dynamic Mockups Domain Validation Debug Page
// This page helps debug domain validation issues with Dynamic Mockups

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function DynamicMockupsDebug() {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState([]);
  
  useEffect(() => {
    // Gather environment info
    const info = {
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      origin: window.location.origin,
      href: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Determine which key should be used
    const hostname = window.location.hostname;
    let expectedKey = '';
    let keySource = '';
    
    if (hostname === 'creators.tresr.com') {
      expectedKey = 'uxRCniavmJbA';
      keySource = 'creators.tresr.com';
    } else if (hostname === 'tresr.com' || hostname === 'www.tresr.com') {
      expectedKey = 'Qtw1zfUN7ZVJ';
      keySource = 'tresr.com';
    } else if (hostname.includes('railway.app')) {
      expectedKey = '18VAujfqJ5iA';
      keySource = 'railway-test';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      expectedKey = 'uxRCniavmJbA';
      keySource = 'localhost (using creators key)';
    }
    
    info.expectedKey = expectedKey;
    info.keySource = keySource;
    
    setDebugInfo(info);
    
    // Run tests
    runTests(expectedKey);
  }, []);
  
  const runTests = async (websiteKey) => {
    const results = [];
    
    // Test 1: Check if SDK is loaded
    results.push({
      test: 'SDK Loaded',
      status: typeof window.initDynamicMockupsIframe !== 'undefined' ? '✅ Pass' : '❌ Fail',
      details: typeof window.initDynamicMockupsIframe !== 'undefined' 
        ? 'SDK function is available' 
        : 'SDK not found - check @dynamic-mockups/mockup-editor-sdk import'
    });
    
    // Test 2: Direct API validation test
    try {
      const response = await axios.post(
        'https://embed-proxy.dynamicmockups.com/api/mockup-editor-iframe-integrations/validate-integration-domain',
        {
          'x-website-key': websiteKey,
          domain: window.location.hostname
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          }
        }
      );
      
      results.push({
        test: 'Domain Validation',
        status: '✅ Pass',
        details: `Domain ${window.location.hostname} is properly whitelisted for key ${websiteKey}`
      });
    } catch (error) {
      if (error.response?.status === 403) {
        results.push({
          test: 'Domain Validation',
          status: '❌ Fail (403)',
          details: `Domain ${window.location.hostname} is NOT whitelisted for key ${websiteKey}. Please add it in Dynamic Mockups dashboard.`
        });
      } else {
        results.push({
          test: 'Domain Validation',
          status: '⚠️ Error',
          details: `Unexpected error: ${error.message}`
        });
      }
    }
    
    // Test 3: Check iframe accessibility
    const iframeTestUrl = 'https://embed.dynamicmockups.com';
    try {
      const response = await fetch(iframeTestUrl, { mode: 'no-cors' });
      results.push({
        test: 'Iframe Accessibility',
        status: '✅ Pass',
        details: 'Can reach Dynamic Mockups embed server'
      });
    } catch (error) {
      results.push({
        test: 'Iframe Accessibility',
        status: '⚠️ Warning',
        details: `Cannot verify iframe access: ${error.message}`
      });
    }
    
    // Test 4: CORS headers check
    results.push({
      test: 'CORS Configuration',
      status: '🔍 Info',
      details: 'Domain validation errors are usually due to missing domain whitelist, not CORS'
    });
    
    setTestResults(results);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🔍 Dynamic Mockups Debug</h1>
        <button 
          onClick={() => navigate('/experimental/embedded')}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          ← Back to Embedded Editor
        </button>
      </div>
      
      {/* Environment Info */}
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2>📊 Environment Information</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {Object.entries(debugInfo).map(([key, value]) => (
              <tr key={key} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold', width: '200px' }}>{key}:</td>
                <td style={{ padding: '8px' }}>
                  <code style={{ background: '#fff', padding: '2px 5px', borderRadius: '3px' }}>
                    {value}
                  </code>
                  {key === 'expectedKey' && (
                    <button 
                      onClick={() => copyToClipboard(value)}
                      style={{ marginLeft: '10px', padding: '2px 8px', cursor: 'pointer' }}
                    >
                      📋 Copy
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Test Results */}
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2>🧪 Validation Tests</h2>
        {testResults.length === 0 ? (
          <p>Running tests...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e0e0e0' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Test</th>
                <th style={{ padding: '10px', textAlign: 'left', width: '120px' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((result, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{result.test}</td>
                  <td style={{ padding: '10px' }}>{result.status}</td>
                  <td style={{ padding: '10px' }}>{result.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Instructions */}
      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2>📝 How to Fix Domain Validation Errors</h2>
        <ol>
          <li>Go to <a href="https://app.dynamicmockups.com" target="_blank" rel="noopener">Dynamic Mockups Dashboard</a></li>
          <li>Navigate to <strong>Settings → Integrations → Website Keys</strong></li>
          <li>Find the key: <code>{debugInfo.expectedKey}</code></li>
          <li>Click "Edit" on that key</li>
          <li>In the "Whitelisted domains" field, add: <code>{debugInfo.hostname}</code></li>
          <li><strong>Important:</strong> Enter ONLY the domain, without http:// or trailing slash</li>
          <li>Save the changes</li>
          <li>Wait 30 seconds for changes to propagate</li>
          <li>Refresh this page and check if tests pass</li>
        </ol>
      </div>
      
      {/* Key Mapping Reference */}
      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '5px' }}>
        <h2>🔑 Website Key Reference</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#bbdefb' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Domain</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Website Key</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px' }}><code>creators.tresr.com</code></td>
              <td style={{ padding: '10px' }}><code>uxRCniavmJbA</code></td>
              <td style={{ padding: '10px' }}>
                {debugInfo.hostname === 'creators.tresr.com' ? '👉 Current' : ''}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px' }}><code>tresr.com</code></td>
              <td style={{ padding: '10px' }}><code>Qtw1zfUN7ZVJ</code></td>
              <td style={{ padding: '10px' }}>
                {debugInfo.hostname === 'tresr.com' ? '👉 Current' : ''}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px' }}><code>*.railway.app</code></td>
              <td style={{ padding: '10px' }}><code>18VAujfqJ5iA</code></td>
              <td style={{ padding: '10px' }}>
                {debugInfo.hostname?.includes('railway.app') ? '👉 Current' : ''}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px' }}><code>localhost</code></td>
              <td style={{ padding: '10px' }}><code>uxRCniavmJbA</code></td>
              <td style={{ padding: '10px' }}>
                {debugInfo.hostname === 'localhost' ? '👉 Current' : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DynamicMockupsDebug;