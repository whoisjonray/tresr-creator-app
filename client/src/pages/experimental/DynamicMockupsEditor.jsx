// Dynamic Mockups Editor - Experimental
// This uses the Dynamic Mockups API instead of Canvas rendering

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import mockupServiceRouter from '../../services/mockupServiceRouter';
import mockupServiceDM from '../../services/mockupServiceDM';
import { FEATURES, trackMockupPerformance } from '../../config/featureFlags';
import './DynamicMockupsEditor.css';

// Use the same product templates as the main editor
const PRODUCT_TEMPLATES = [
  { id: 'tee', name: 'Medium Weight T-Shirt', price: 22, hasTemplate: true },
  { id: 'boxy', name: 'Oversized Drop Shoulder', price: 26, hasTemplate: true },
  { id: 'med-hood', name: 'Medium Weight Hoodie', price: 42, hasTemplate: true },
  { id: 'wmn-hoodie', name: "Women's Hoodie", price: 42, hasTemplate: true },
  { id: 'mediu', name: 'Medium Weight Sweatshirt', price: 36, hasTemplate: true },
  { id: 'next-crop', name: 'Next Level Crop Top', price: 24, hasTemplate: false },
  { id: 'polo', name: 'Standard Polo', price: 28, hasTemplate: false },
  { id: 'mug', name: 'Coffee Mug', price: 15, hasTemplate: false },
];

function DynamicMockupsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [designImage, setDesignImage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_TEMPLATES[0]);
  const [mockupUrl, setMockupUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [collections, setCollections] = useState([]);
  
  // Force Dynamic Mockups mode for this experimental editor
  useEffect(() => {
    mockupServiceRouter.setOverrideMode('dynamic_mockups');
    return () => {
      mockupServiceRouter.clearOverride();
    };
  }, []);
  
  // Load collections and templates on mount
  useEffect(() => {
    loadDynamicMockupsData();
  }, []);
  
  const loadDynamicMockupsData = async () => {
    try {
      console.log('Loading Dynamic Mockups data...');
      const [cols, temps] = await Promise.all([
        mockupServiceDM.getCollections().catch(() => []),
        mockupServiceDM.getMockups().catch(() => [])
      ]);
      
      // Ensure we have arrays
      const collectionsArray = Array.isArray(cols) ? cols : [];
      const templatesArray = Array.isArray(temps) ? temps : [];
      
      setCollections(collectionsArray);
      setTemplates(templatesArray);
      console.log(`Loaded ${collectionsArray.length} collections and ${templatesArray.length} templates`);
    } catch (error) {
      console.error('Failed to load Dynamic Mockups data:', error);
      setCollections([]);
      setTemplates([]);
    }
  };
  
  // Handle file drop
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target.result;
      setDesignImage(imageDataUrl);
      
      // Automatically generate mockup
      await generateMockup(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg']
    },
    maxFiles: 1
  });
  
  // Generate mockup using Dynamic Mockups
  const generateMockup = async (imageUrl = designImage) => {
    if (!imageUrl) {
      setError('No design image uploaded');
      return;
    }
    
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      console.log('🎨 Generating Dynamic Mockup for', selectedProduct.name);
      
      // Upload design and generate mockup
      const designUrl = await mockupServiceDM.uploadDesign(imageUrl);
      const mockup = await mockupServiceDM.generatePreview(
        designUrl,
        selectedProduct.id,
        'White',
        {
          position: { x: 0.5, y: 0.5 },
          scale: 1.0
        }
      );
      
      const duration = Date.now() - startTime;
      
      setMockupUrl(mockup.url || mockup);
      setStats({
        duration,
        method: 'Dynamic Mockups API',
        cached: false,
        template: selectedProduct.id
      });
      
      trackMockupPerformance('experimental_render', duration, {
        product: selectedProduct.id,
        success: true
      });
      
      console.log(`✅ Mockup generated in ${duration}ms`);
    } catch (err) {
      console.error('❌ Mockup generation failed:', err);
      setError(err.message);
      
      trackMockupPerformance('experimental_render', Date.now() - startTime, {
        product: selectedProduct.id,
        success: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle product change
  const handleProductChange = async (product) => {
    setSelectedProduct(product);
    if (designImage) {
      await generateMockup();
    }
  };
  
  // Compare with canvas rendering
  const compareWithCanvas = async () => {
    if (!designImage) {
      setError('No design image to compare');
      return;
    }
    
    setLoading(true);
    try {
      const comparison = await mockupServiceRouter.compareServices(
        designImage,
        selectedProduct.id,
        'White',
        { position: { x: 0.5, y: 0.5 }, scale: 1.0 }
      );
      
      console.log('📊 Comparison Results:', comparison);
      setStats({
        ...stats,
        comparison
      });
    } catch (err) {
      setError('Comparison failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="dynamic-mockups-editor">
      <div className="editor-header">
        <h1>🧪 Dynamic Mockups Editor (Experimental)</h1>
        <div className="editor-badge">
          <span className="badge-dm">Dynamic Mockups API</span>
          <span className="badge-experimental">Experimental</span>
        </div>
      </div>
      
      <div className="editor-notice">
        <p>⚡ This editor uses Dynamic Mockups API instead of Canvas rendering</p>
        <p>📊 Compare performance with the <button onClick={() => navigate('/admin/mockup-comparison')}>Comparison Dashboard</button></p>
      </div>
      
      <div className="editor-layout">
        {/* Left Panel - Upload & Settings */}
        <div className="editor-sidebar">
          <div className="upload-section">
            <h3>Upload Design</h3>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              {designImage ? (
                <div className="design-preview">
                  <img src={designImage} alt="Design" />
                  <p>Click or drag to replace</p>
                </div>
              ) : (
                <div className="dropzone-content">
                  <p>🎨 Drag & drop your design here</p>
                  <p>or click to select</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="product-selection">
            <h3>Select Product</h3>
            <div className="product-list">
              {PRODUCT_TEMPLATES.map(product => (
                <button
                  key={product.id}
                  className={`product-item ${selectedProduct.id === product.id ? 'active' : ''} ${!product.hasTemplate ? 'no-template' : ''}`}
                  onClick={() => handleProductChange(product)}
                  disabled={!product.hasTemplate}
                >
                  <span className="product-name">{product.name}</span>
                  <span className="product-price">${product.price}</span>
                  {!product.hasTemplate && <span className="no-template-badge">No template yet</span>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="actions">
            <button 
              className="btn-generate"
              onClick={() => generateMockup()}
              disabled={!designImage || loading}
            >
              {loading ? 'Generating...' : 'Generate Mockup'}
            </button>
            
            <button 
              className="btn-compare"
              onClick={compareWithCanvas}
              disabled={!designImage || loading}
            >
              Compare with Canvas
            </button>
            
            <button 
              className="btn-canvas"
              onClick={() => navigate('/design/new')}
            >
              Switch to Canvas Editor
            </button>
          </div>
        </div>
        
        {/* Center - Mockup Display */}
        <div className="editor-main">
          <div className="mockup-display">
            {loading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Generating mockup with Dynamic Mockups API...</p>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )}
            
            {mockupUrl && !loading && (
              <div className="mockup-result">
                <img src={mockupUrl} alt="Generated Mockup" />
              </div>
            )}
            
            {!mockupUrl && !loading && !error && (
              <div className="empty-state">
                <h3>Upload a design to get started</h3>
                <p>Your mockup will appear here</p>
              </div>
            )}
          </div>
          
          {stats && (
            <div className="stats-panel">
              <h4>Performance Stats</h4>
              <div className="stat-grid">
                <div className="stat">
                  <span className="stat-label">Render Time</span>
                  <span className="stat-value">{stats.duration}ms</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Method</span>
                  <span className="stat-value">{stats.method}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Template</span>
                  <span className="stat-value">{stats.template}</span>
                </div>
              </div>
              
              {stats.comparison && (
                <div className="comparison-results">
                  <h4>Canvas vs Dynamic Mockups</h4>
                  <div className="comparison-grid">
                    <div className="comparison-item">
                      <span>Canvas</span>
                      <span>{stats.comparison.canvas?.time || 'N/A'}ms</span>
                    </div>
                    <div className="comparison-item">
                      <span>Dynamic Mockups</span>
                      <span>{stats.comparison.dynamicMockups?.time || 'N/A'}ms</span>
                    </div>
                    <div className="comparison-item winner">
                      <span>Winner</span>
                      <span>{stats.comparison.comparison?.winner || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right Panel - Info */}
        <div className="editor-info">
          <div className="info-section">
            <h3>Available Templates</h3>
            <p>{templates?.length || 0} templates loaded</p>
            <ul className="template-list">
              {Array.isArray(templates) && templates.slice(0, 5).map(t => (
                <li key={t.uuid || t.id}>{t.name}</li>
              ))}
            </ul>
          </div>
          
          <div className="info-section">
            <h3>Collections</h3>
            <p>{collections?.length || 0} collection(s)</p>
            <ul className="collection-list">
              {Array.isArray(collections) && collections.map(c => (
                <li key={c.uuid || c.id}>{c.name}</li>
              ))}
            </ul>
          </div>
          
          <div className="info-section">
            <h3>Service Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-dot green"></span>
                <span>Dynamic Mockups API</span>
              </div>
              <div className="status-item">
                <span className="status-dot green"></span>
                <span>Canvas Fallback</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DynamicMockupsEditor;