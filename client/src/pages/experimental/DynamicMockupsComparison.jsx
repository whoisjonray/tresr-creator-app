// Dynamic Mockups vs Canvas Comparison
// This uses the SAME positioning system as the main editor but compares rendering methods

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import mockupServiceRouter from '../../services/mockupServiceRouter';
import mockupServiceDM from '../../services/mockupServiceDM';
import canvasImageGenerator from '../../services/canvasImageGenerator';
import { getGarmentImage } from '../../config/garmentImagesCloudinary';
import { usePrintAreas } from '../../contexts/PrintAreasContext';
// import DesignCanvas from '../../components/DesignCanvas'; // Temporarily disabled
import './DynamicMockupsComparison.css';

// Use the same product templates as the main editor
const PRODUCT_TEMPLATES = [
  { id: 'tee', name: 'Medium Weight T-Shirt', price: 22, dmTemplateId: 'aadbef17-d095-4c2a-b1fe-118e76b50e8a' },
  { id: 'boxy', name: 'Oversized Drop Shoulder', price: 26, dmTemplateId: null },
  { id: 'med-hood', name: 'Medium Weight Hoodie', price: 42, dmTemplateId: 'd8cdbf1f-0cf1-4a7f-a82d-d30296e95b48' },
  { id: 'wmn-hoodie', name: "Women's Hoodie", price: 42, dmTemplateId: '6e982b59-e3e5-4db4-9aca-ac9a7f99caf6' },
  { id: 'mediu', name: 'Medium Weight Sweatshirt', price: 36, dmTemplateId: '009fa7f1-d8e0-4e87-94ed-e76badef0b8f' },
  { id: 'next-crop', name: 'Next Level Crop Top', price: 24, dmTemplateId: null },
  { id: 'polo', name: 'Standard Polo', price: 28, dmTemplateId: '4de03a53-2f46-4bf6-be8f-dcedec039b30' },
];

const COLOR_OPTIONS = ['White', 'Black', 'Navy', 'Light Grey'];

// Simple inline canvas component for positioning
function SimpleCanvas({ designImage, designPosition, onPositionChange, printArea }) {
  const canvasRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  React.useEffect(() => {
    if (!canvasRef.current || !designImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw print area outline
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(printArea.x, printArea.y, printArea.width, printArea.height);
    
    // Draw design if available
    if (designImage) {
      const x = printArea.x + (designPosition.x * printArea.width);
      const y = printArea.y + (designPosition.y * printArea.height);
      const width = designPosition.scale * printArea.width * 0.8;
      const height = (designImage.height / designImage.width) * width;
      
      ctx.drawImage(
        designImage,
        x - width / 2,
        y - height / 2,
        width,
        height
      );
      
      // Draw selection border
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x - width / 2, y - height / 2, width, height);
      ctx.setLineDash([]);
    }
  }, [designImage, designPosition, printArea]);
  
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale to canvas coordinates
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    // Check if click is within print area
    if (
      canvasX >= printArea.x &&
      canvasX <= printArea.x + printArea.width &&
      canvasY >= printArea.y &&
      canvasY <= printArea.y + printArea.height
    ) {
      const newX = (canvasX - printArea.x) / printArea.width;
      const newY = (canvasY - printArea.y) / printArea.height;
      
      onPositionChange({
        ...designPosition,
        x: Math.max(0, Math.min(1, newX)),
        y: Math.max(0, Math.min(1, newY))
      });
    }
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={600}
      onClick={handleCanvasClick}
      style={{
        width: '100%',
        height: 'auto',
        cursor: 'crosshair',
        border: '2px solid #e5e7eb',
        borderRadius: '0.5rem',
        background: 'white'
      }}
    />
  );
}

function DynamicMockupsComparison() {
  const navigate = useNavigate();
  const { printAreas } = usePrintAreas();
  
  // Design state
  const [designImage, setDesignImage] = useState(null);
  const [designImageUrl, setDesignImageUrl] = useState(null);
  const [designPosition, setDesignPosition] = useState({ x: 0.5, y: 0.5, scale: 1.0 });
  
  // Product state
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_TEMPLATES[0]);
  const [selectedColor, setSelectedColor] = useState('White');
  
  // Mockup results
  const [canvasMockup, setCanvasMockup] = useState(null);
  const [dynamicMockup, setDynamicMockup] = useState(null);
  const [loading, setLoading] = useState({ canvas: false, dynamic: false });
  const [stats, setStats] = useState({ canvas: null, dynamic: null });
  const [error, setError] = useState(null);
  
  // Canvas ref for positioning
  const canvasRef = useRef(null);
  
  // Get print area for current product
  const getCurrentPrintArea = () => {
    const area = printAreas?.[selectedProduct.id];
    if (!area) {
      // Fallback to default values
      return {
        x: 150,
        y: 150,
        width: 300,
        height: 300
      };
    }
    return area;
  };
  
  // Handle file drop
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      setDesignImageUrl(imageDataUrl);
      
      // Create image object for canvas
      const img = new Image();
      img.onload = () => {
        setDesignImage(img);
      };
      img.src = imageDataUrl;
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
  
  // Generate both mockups for comparison
  const generateComparison = async () => {
    if (!designImageUrl || !designImage) {
      setError('Please upload a design first');
      return;
    }
    
    setError(null);
    setCanvasMockup(null);
    setDynamicMockup(null);
    
    // Convert position to actual coordinates based on print area
    const printArea = getCurrentPrintArea();
    const actualPosition = {
      x: printArea.x + (designPosition.x * printArea.width),
      y: printArea.y + (designPosition.y * printArea.height),
      width: designPosition.scale * printArea.width * 0.8,
      height: (designImage.height / designImage.width) * (designPosition.scale * printArea.width * 0.8)
    };
    
    // Generate Canvas mockup
    generateCanvasMockup(actualPosition);
    
    // Generate Dynamic Mockups mockup if template available
    if (selectedProduct.dmTemplateId) {
      generateDynamicMockup(actualPosition);
    } else {
      setStats(prev => ({ ...prev, dynamic: { error: 'No Dynamic Mockups template available for this product' } }));
    }
  };
  
  // Generate mockup using Canvas
  const generateCanvasMockup = async (position) => {
    setLoading(prev => ({ ...prev, canvas: true }));
    const startTime = Date.now();
    
    try {
      console.log('🎨 Generating Canvas mockup...');
      
      // Use the canvas image generator with correct method
      const mockupUrl = await canvasImageGenerator.generateProductImage(
        designImageUrl,
        selectedProduct.id,  // garmentTemplate
        selectedColor,       // color
        position,           // position object with x, y, width, height
        designPosition.scale // scale
      );
      
      const duration = Date.now() - startTime;
      setCanvasMockup(mockupUrl);
      setStats(prev => ({
        ...prev,
        canvas: {
          duration,
          method: 'Canvas API',
          size: 'N/A'
        }
      }));
      
      console.log(`✅ Canvas mockup generated in ${duration}ms`);
    } catch (err) {
      console.error('❌ Canvas generation failed:', err);
      setStats(prev => ({ ...prev, canvas: { error: err.message } }));
    } finally {
      setLoading(prev => ({ ...prev, canvas: false }));
    }
  };
  
  // Generate mockup using Dynamic Mockups API
  const generateDynamicMockup = async (position) => {
    setLoading(prev => ({ ...prev, dynamic: true }));
    const startTime = Date.now();
    
    try {
      console.log('🎨 Generating Dynamic Mockups mockup...');
      
      // Upload design to Dynamic Mockups
      const designUrl = await mockupServiceDM.uploadDesign(designImageUrl);
      
      // Convert position to Dynamic Mockups format (0-1 range)
      const dmPosition = {
        x: designPosition.x,
        y: designPosition.y
      };
      
      // Generate mockup using generatePreview method
      const mockup = await mockupServiceDM.generatePreview(
        designUrl,
        selectedProduct.dmTemplateId,
        selectedColor,
        {
          position: dmPosition,
          scale: designPosition.scale,
          rotation: 0
        }
      );
      
      const duration = Date.now() - startTime;
      setDynamicMockup(mockup.url || mockup);
      setStats(prev => ({
        ...prev,
        dynamic: {
          duration,
          method: 'Dynamic Mockups API',
          templateId: selectedProduct.dmTemplateId
        }
      }));
      
      console.log(`✅ Dynamic Mockups mockup generated in ${duration}ms`);
    } catch (err) {
      console.error('❌ Dynamic Mockups generation failed:', err);
      setStats(prev => ({ ...prev, dynamic: { error: err.message } }));
    } finally {
      setLoading(prev => ({ ...prev, dynamic: false }));
    }
  };
  
  // Handle product change
  const handleProductChange = (product) => {
    setSelectedProduct(product);
    setCanvasMockup(null);
    setDynamicMockup(null);
    setStats({ canvas: null, dynamic: null });
  };
  
  // Handle color change
  const handleColorChange = (color) => {
    setSelectedColor(color);
    setCanvasMockup(null);
    setDynamicMockup(null);
    setStats({ canvas: null, dynamic: null });
  };
  
  return (
    <div className="comparison-page">
      <div className="comparison-header">
        <h1>🔬 Canvas vs Dynamic Mockups Comparison</h1>
        <button className="btn-back" onClick={() => navigate('/design/new')}>
          ← Back to Editor
        </button>
      </div>
      
      <div className="comparison-layout">
        {/* Left Panel - Design Upload & Positioning */}
        <div className="control-panel">
          <div className="upload-section">
            <h3>1. Upload Design</h3>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              {designImageUrl ? (
                <img src={designImageUrl} alt="Design" className="design-preview" />
              ) : (
                <div className="dropzone-content">
                  <p>🎨 Drag & drop your design</p>
                  <p>or click to select</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="positioning-section">
            <h3>2. Position Design</h3>
            <div className="canvas-wrapper" style={{ minHeight: '300px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
              {designImage ? (
                <SimpleCanvas
                  designImage={designImage}
                  designPosition={designPosition}
                  onPositionChange={setDesignPosition}
                  printArea={getCurrentPrintArea()}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '250px', 
                    background: 'white', 
                    border: '2px dashed #d1d5db',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <p style={{ color: '#9ca3af' }}>Canvas will appear here after upload</p>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    👆 Upload a design above to enable positioning
                  </p>
                </div>
              )}
            </div>
            
            <div className="position-controls">
              <div className="control-row">
                <label>X: {(designPosition.x * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={designPosition.x * 100}
                  onChange={(e) => setDesignPosition(prev => ({ ...prev, x: e.target.value / 100 }))}
                />
              </div>
              <div className="control-row">
                <label>Y: {(designPosition.y * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={designPosition.y * 100}
                  onChange={(e) => setDesignPosition(prev => ({ ...prev, y: e.target.value / 100 }))}
                />
              </div>
              <div className="control-row">
                <label>Scale: {(designPosition.scale * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={designPosition.scale * 100}
                  onChange={(e) => setDesignPosition(prev => ({ ...prev, scale: e.target.value / 100 }))}
                />
              </div>
            </div>
          </div>
          
          <div className="product-section">
            <h3>3. Select Product</h3>
            <div className="product-grid">
              {PRODUCT_TEMPLATES.map(product => (
                <button
                  key={product.id}
                  className={`product-btn ${selectedProduct.id === product.id ? 'active' : ''} ${!product.dmTemplateId ? 'no-dm' : ''}`}
                  onClick={() => handleProductChange(product)}
                >
                  {product.name}
                  {!product.dmTemplateId && <span className="badge">Canvas Only</span>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="color-section">
            <h3>4. Select Color</h3>
            <div className="color-grid">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                  onClick={() => handleColorChange(color)}
                  style={{
                    background: color.toLowerCase() === 'white' ? '#fafafa' : 
                               color.toLowerCase() === 'black' ? '#000' :
                               color.toLowerCase() === 'navy' ? '#1e3a8a' :
                               '#9ca3af'
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            className="btn-generate"
            onClick={generateComparison}
            disabled={!designImageUrl || loading.canvas || loading.dynamic}
          >
            🚀 Generate Comparison
          </button>
        </div>
        
        {/* Right Panel - Side-by-side Results */}
        <div className="results-panel">
          <div className="mockup-grid">
            {/* Canvas Result */}
            <div className="mockup-column">
              <h3>Canvas Rendering</h3>
              <div className="mockup-display">
                {loading.canvas && (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Generating with Canvas...</p>
                  </div>
                )}
                {canvasMockup && !loading.canvas && (
                  <img src={canvasMockup} alt="Canvas Mockup" />
                )}
                {!canvasMockup && !loading.canvas && (
                  <div className="empty-state">
                    <p>Canvas mockup will appear here</p>
                  </div>
                )}
              </div>
              {stats.canvas && (
                <div className="stats">
                  {stats.canvas.error ? (
                    <p className="error">❌ {stats.canvas.error}</p>
                  ) : (
                    <>
                      <p>⏱ {stats.canvas.duration}ms</p>
                      <p>🎯 {stats.canvas.method}</p>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Dynamic Mockups Result */}
            <div className="mockup-column">
              <h3>Dynamic Mockups API</h3>
              <div className="mockup-display">
                {loading.dynamic && (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Generating with Dynamic Mockups...</p>
                  </div>
                )}
                {dynamicMockup && !loading.dynamic && (
                  <img src={dynamicMockup} alt="Dynamic Mockup" />
                )}
                {!dynamicMockup && !loading.dynamic && (
                  <div className="empty-state">
                    <p>Dynamic Mockups result will appear here</p>
                  </div>
                )}
              </div>
              {stats.dynamic && (
                <div className="stats">
                  {stats.dynamic.error ? (
                    <p className="error">❌ {stats.dynamic.error}</p>
                  ) : (
                    <>
                      <p>⏱ {stats.dynamic.duration}ms</p>
                      <p>🎯 {stats.dynamic.method}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Comparison Summary */}
          {stats.canvas && stats.dynamic && !stats.canvas.error && !stats.dynamic.error && (
            <div className="comparison-summary">
              <h3>Performance Comparison</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Winner (Speed)</span>
                  <span className="winner">
                    {stats.canvas.duration < stats.dynamic.duration ? 'Canvas' : 'Dynamic Mockups'}
                    ({Math.abs(stats.canvas.duration - stats.dynamic.duration)}ms faster)
                  </span>
                </div>
                <div className="summary-item">
                  <span>Canvas Time</span>
                  <span>{stats.canvas.duration}ms</span>
                </div>
                <div className="summary-item">
                  <span>Dynamic Mockups Time</span>
                  <span>{stats.dynamic.duration}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DynamicMockupsComparison;