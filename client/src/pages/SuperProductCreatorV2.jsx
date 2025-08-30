import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import api from '../services/api';
import mockupService from '../services/mockupService';
import canvasImageGenerator from '../services/canvasImageGenerator';
import { getGarmentImage as getCloudinaryImage } from '../config/garmentImagesCloudinary';
import { testSuperProductConfig } from '../config/testSuperProductConfig';
import { usePrintAreas } from '../contexts/PrintAreasContext';
import { forceCanvasRender } from '../utils/force-canvas-render';
import { fixCanvasProductSwitching } from '../utils/fix-canvas-product-switching';
import { useResponsiveCanvas } from '../hooks/useResponsiveCanvas';
import { useTouchDrag } from '../hooks/useTouchDrag';
import './SuperProductCreator.css';
import './DesignEditor.css'; // Import DesignEditor styles too

// Use same product templates as DesignEditor
const PRODUCT_TEMPLATES = [
  { id: 'tee', name: 'Medium Weight T-Shirt', templateId: 'tshirt_front', price: 22, colors: ['Black', 'Navy', 'Natural', 'White', 'Dark Grey', 'Cardinal Red'] },
  { id: 'boxy', name: 'Oversized Drop Shoulder', templateId: 'tshirt_boxy_front', price: 26, colors: ['Black', 'Natural'] },
  { id: 'next-crop', name: 'Next Level Crop Top', templateId: 'croptop_front', price: 24, colors: ['Black', 'Gold', 'Royal Heather', 'Dark Grey', 'Pink', 'Light Grey', 'Navy', 'Cardinal Red', 'White'] },
  { id: 'baby-tee', name: 'Ladies Baby Tee', templateId: 'babytee_front', price: 23, colors: ['Black', 'White'] },
  { id: 'wmn-hoodie', name: "Women's Independent Hoodie", templateId: 'hoodie_front', price: 42, colors: ['Black', 'Black Camo', 'Pink', 'Natural', 'Cotton Candy', 'Light Grey', 'Mint', 'White'] },
  { id: 'med-hood', name: 'Medium Weight Hoodie', templateId: 'hoodie_front', price: 42, colors: ['Black', 'White', 'Gold', 'Light Grey', 'Cardinal Red', 'Alpine Green', 'Navy', 'Mint'] },
  { id: 'mediu', name: 'Medium Weight Sweatshirt', templateId: 'crewneck_front', price: 36, colors: ['Black', 'White', 'Navy', 'Light Grey', 'Army Heather', 'Cardinal Red', 'Royal Heather', 'Dark Grey'] },
  { id: 'polo', name: 'Standard Polo', templateId: 'polo_front', price: 28, colors: ['Black', 'White', 'Navy', 'Light Grey'] },
];

const COLOR_PALETTE = [
  { name: 'Black', hex: '#000000' },
  { name: 'Black Camo', hex: '#1a1a1a' },
  { name: 'Dark Grey', hex: '#4A4A4A' },
  { name: 'Light Grey', hex: '#9CA3AF' },
  { name: 'Natural', hex: '#FEF3C7' },
  { name: 'White', hex: '#FAFAFA' },
  { name: 'Mint', hex: '#98FF98' },
  { name: 'Navy', hex: '#080F20' },
  { name: 'Cardinal Red', hex: '#EC5039' },
  { name: 'Gold', hex: '#F6CB46' },
  { name: 'Alpine Green', hex: '#165B33' },
  { name: 'Army Heather', hex: '#6B7043' },
  { name: 'Royal Heather', hex: '#4169E1' },
  { name: 'Pink', hex: '#F82F57' },
  { name: 'Cotton Candy', hex: '#FFB6C1' }
];

const backgrounds = [
  { id: 'coffee-shop', name: 'Cozy Coffee Shop', gradient: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F4A460 100%)', conversion: '15.2%', views: '4.5k' },
  { id: 'home-office', name: 'Home Office Morning', gradient: 'linear-gradient(135deg, #E8F4F8 0%, #B8D4E3 50%, #87CEEB 100%)', conversion: '13.7%', views: '3.2k' },
  { id: 'bookstore', name: 'Bookstore Café', gradient: 'linear-gradient(135deg, #704214 0%, #8B4513 50%, #A0522D 100%)', conversion: '11.9%', views: '2.8k' },
  { id: 'kitchen', name: 'Kitchen Counter', gradient: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 50%, #D3D3D3 100%)', conversion: '10.4%', views: '1.9k' }
];

function SuperProductCreatorV2() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [credits, setCredits] = useState(250);
  
  // Design state
  const [designFile, setDesignFile] = useState(null);
  const [designUrl, setDesignUrl] = useState('');
  const [designPosition, setDesignPosition] = useState({ x: 200, y: 180 });
  const [designScale, setDesignScale] = useState(1);
  const [designRotation, setDesignRotation] = useState(0);
  const [designAnalysis, setDesignAnalysis] = useState(null);
  const [productTitle, setProductTitle] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(null);
  
  // Product state
  const [activeProduct, setActiveProduct] = useState('tee');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [enabledProducts, setEnabledProducts] = useState({
    'tee': true,
    'baby-tee': true,
    'wmn-hoodie': true
  });
  const [productColors, setProductColors] = useState({});
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Canvas refs
  const canvasRef = useRef(null);
  const printAreas = usePrintAreas();
  
  // NFC state
  const [nfcExperience, setNfcExperience] = useState('');
  const [linkType, setLinkType] = useState('social');
  const [customLink, setCustomLink] = useState('');
  
  // Responsive canvas hook
  const { canvasSize, containerRef } = useResponsiveCanvas();
  
  // Touch drag support
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchDrag(
    designPosition,
    setDesignPosition,
    canvasRef
  );

  // File upload handler with Gemini AI analysis
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setDesignFile(file);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setDesignUrl(dataUrl);
      
      // Trigger Gemini AI analysis
      try {
        setDesignAnalysis({ analyzing: true });
        
        // Simulated Gemini API call - replace with actual API
        setTimeout(() => {
          setDesignAnalysis({
            title: "AI-Powered Design Title",
            description: "This design features modern aesthetics with bold typography and vibrant colors. Perfect for tech enthusiasts and creative professionals.",
            tags: ['modern', 'tech', 'creative', 'bold'],
            suggestedProducts: ['tee', 'hoodie', 'mug'],
            targetAudience: 'Tech professionals, designers, millennials',
            category: 'Technology',
            colorAnalysis: {
              primary: '#3b82f6',
              secondary: '#10b981',
              accent: '#f59e0b'
            }
          });
          setProductTitle("AI-Powered Design Title");
          setCredits(prev => prev - 1);
        }, 2000);
        
        // In production:
        // const response = await api.post('/ai/analyze-design', {
        //   image: dataUrl,
        //   model: 'gemini-pro-vision'
        // });
        // setDesignAnalysis(response.data);
        
      } catch (error) {
        console.error('AI analysis failed:', error);
        setDesignAnalysis({ error: 'Analysis failed' });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  // Canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 600, 600);
    
    // Get current product template
    const product = PRODUCT_TEMPLATES.find(p => p.id === activeProduct);
    if (!product) return;
    
    // Draw garment background
    const garmentUrl = getCloudinaryImage(activeProduct, selectedColor.toLowerCase().replace(' ', '-'));
    if (garmentUrl) {
      const garmentImg = new Image();
      garmentImg.onload = () => {
        ctx.drawImage(garmentImg, 0, 0, 600, 600);
        
        // Draw design if uploaded
        if (designUrl) {
          const designImg = new Image();
          designImg.onload = () => {
            ctx.save();
            
            // Get print area for this product
            const printArea = printAreas[activeProduct]?.front || { 
              x: 200, y: 180, width: 200, height: 250 
            };
            
            // Apply transformations
            ctx.translate(designPosition.x, designPosition.y);
            ctx.rotate(designRotation * Math.PI / 180);
            ctx.scale(designScale, designScale);
            
            // Draw design centered
            const width = printArea.width;
            const height = printArea.height;
            ctx.drawImage(designImg, -width/2, -height/2, width, height);
            
            ctx.restore();
          };
          designImg.src = designUrl;
        }
      };
      garmentImg.src = garmentUrl;
    }
  }, [activeProduct, selectedColor, designUrl, designPosition, designScale, designRotation, printAreas]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle product change
  const handleProductChange = (productId) => {
    setActiveProduct(productId);
    const product = PRODUCT_TEMPLATES.find(p => p.id === productId);
    if (product && !product.colors.includes(selectedColor)) {
      setSelectedColor(product.colors[0]);
    }
    forceCanvasRender(canvasRef);
  };

  // Toggle product enable/disable
  const toggleProductEnabled = (productId) => {
    setEnabledProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Generate all product images
  const generateAllImages = async () => {
    setGeneratingImages(true);
    setGenerationProgress(0);
    
    const enabledProductsList = Object.entries(enabledProducts)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => id);
    
    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setGeneratingImages(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
    
    setCredits(prev => prev - (enabledProductsList.length * 5));
    
    // In production, call actual API
    // await api.post('/generate-all-mockups', {
    //   products: enabledProductsList,
    //   design: designUrl,
    //   background: selectedBackground
    // });
  };

  return (
    <div className="spc-container">
      {/* Header */}
      <div className="spc-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`spc-hamburger ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="spc-logo">
            <span>🎨</span>
            <span>TRESR Creator</span>
          </div>
        </div>
        <div className="spc-credit-balance">
          <div className="spc-credits">
            <span>{credits}</span> Credits
          </div>
          <button className="spc-btn spc-btn-primary">Buy Credits</button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="spc-progress-container">
        <div className="spc-progress-steps">
          <div className={`spc-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="spc-step-number">{currentStep > 1 ? '✓' : '1'}</div>
            <div className="spc-step-label">Upload & Analyze</div>
          </div>
          <div className={`spc-step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="spc-step-number">{currentStep > 2 ? '✓' : '2'}</div>
            <div className="spc-step-label">Select Background</div>
          </div>
          <div className={`spc-step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="spc-step-number">{currentStep > 3 ? '✓' : '3'}</div>
            <div className="spc-step-label">Configure Products</div>
          </div>
          <div className={`spc-step ${currentStep === 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
            <div className="spc-step-number">{currentStep > 4 ? '✓' : '4'}</div>
            <div className="spc-step-label">Generate Images</div>
          </div>
          <div className={`spc-step ${currentStep === 5 ? 'active' : ''}`}>
            <div className="spc-step-number">5</div>
            <div className="spc-step-label">Publish</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="spc-main-container">
        {/* Sidebar */}
        <div className={`spc-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="spc-menu-item active">
            <span>🏠</span>
            <span>Dashboard</span>
          </div>
          <div className="spc-menu-item">
            <span>🎨</span>
            <span>Create Design</span>
          </div>
          <div className="spc-menu-item">
            <span>📦</span>
            <span>Products</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="spc-content">
          {/* Step 1: Upload & Analyze (using DesignEditor upload-section style) */}
          {currentStep === 1 && (
            <div className="upload-section" style={{ maxWidth: '100%', margin: '0 auto' }}>
              <h2>Upload Your Design</h2>
              
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                {!designUrl ? (
                  <>
                    <span className="upload-icon">📤</span>
                    <p>Drop your design here or click to browse</p>
                    <p className="file-types">PNG, JPG, GIF up to 10MB</p>
                  </>
                ) : (
                  <div className="design-preview">
                    <img src={designUrl} alt="Uploaded design" />
                  </div>
                )}
              </div>

              {/* Gemini AI Analysis */}
              {designAnalysis && !designAnalysis.analyzing && (
                <div className="spc-ai-analysis" style={{ marginTop: '24px' }}>
                  <div className="spc-ai-header">
                    <span style={{ fontSize: '24px' }}>✨</span>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>Gemini AI Analysis</div>
                    <span className="spc-credits" style={{ fontSize: '12px' }}>1 credit</span>
                  </div>
                  <div className="spc-ai-content">
                    <div className="spc-ai-description">{designAnalysis.description}</div>
                    <div className="spc-ai-fields">
                      <div className="spc-field-row">
                        <label>Title</label>
                        <div className="spc-field-input">
                          <input 
                            type="text" 
                            value={productTitle} 
                            onChange={(e) => setProductTitle(e.target.value)}
                          />
                          <button className="spc-refresh-btn" title="Regenerate title (1 credit)">
                            🔄
                          </button>
                        </div>
                      </div>
                      <div className="spc-field-row">
                        <label>Category</label>
                        <select value={designAnalysis.category}>
                          <option>Technology</option>
                          <option>Coffee</option>
                          <option>Crypto/Web3</option>
                          <option>Mental Health</option>
                        </select>
                      </div>
                      <div className="spc-field-row">
                        <label>Target Audience</label>
                        <div>{designAnalysis.targetAudience}</div>
                      </div>
                      <div className="spc-field-row">
                        <label>Suggested Tags</label>
                        <div className="tag-list">
                          {designAnalysis.tags?.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="spc-step-actions">
                    <button 
                      className="spc-btn spc-btn-primary" 
                      onClick={() => setCurrentStep(2)}
                    >
                      Continue to Background Selection →
                    </button>
                  </div>
                </div>
              )}

              {designAnalysis?.analyzing && (
                <div className="analyzing-placeholder">
                  <div className="spinner"></div>
                  <p>Analyzing your design with Gemini AI...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Background Selection */}
          {currentStep === 2 && (
            <div className="spc-step-content active">
              <div className="spc-page-title">Choose Your Background</div>
              <div className="spc-page-subtitle">Select a lifestyle background that matches your design's vibe</div>

              <div className="spc-backgrounds-grid">
                {backgrounds.map(bg => (
                  <div 
                    key={bg.id}
                    className={`spc-background-card ${selectedBackground === bg.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBackground(bg.id)}
                  >
                    <div className="spc-background-preview" style={{ background: bg.gradient }}>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={getCloudinaryImage('tee', 'black')}
                          style={{ width: '60%', height: 'auto', zIndex: 10 }}
                          alt="Preview"
                        />
                      </div>
                    </div>
                    <div className="spc-background-info">
                      <div className="spc-background-name">{bg.name}</div>
                      <div className="spc-background-stats">
                        <span>📈 {bg.conversion}</span>
                        <span>👁️ {bg.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="spc-step-actions">
                <button className="spc-btn spc-btn-secondary" onClick={() => setCurrentStep(1)}>
                  ← Back
                </button>
                <button 
                  className="spc-btn spc-btn-primary" 
                  onClick={() => setCurrentStep(3)}
                  disabled={!selectedBackground}
                >
                  Continue to Product Configuration →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Configure Products (using DesignEditor layout) */}
          {currentStep === 3 && (
            <div className="configure-section">
              <div className="editor-layout">
                {/* Canvas Section */}
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Product Selector */}
                  <div className="product-selector">
                    {PRODUCT_TEMPLATES.map(product => (
                      <button
                        key={product.id}
                        className={`product-btn ${activeProduct === product.id ? 'active' : ''}`}
                        onClick={() => handleProductChange(product.id)}
                      >
                        {product.name}
                      </button>
                    ))}
                  </div>

                  {/* Canvas */}
                  <div ref={containerRef} className="canvas-container">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={600}
                      style={{ 
                        width: '100%', 
                        height: 'auto',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    />
                  </div>

                  {/* Controls */}
                  <div className="canvas-controls">
                    <div className="control-group">
                      <label>Scale</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={designScale}
                        onChange={(e) => setDesignScale(parseFloat(e.target.value))}
                      />
                      <span>{Math.round(designScale * 100)}%</span>
                    </div>
                    <div className="control-group">
                      <label>Rotation</label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={designRotation}
                        onChange={(e) => setDesignRotation(parseInt(e.target.value))}
                      />
                      <span>{designRotation}°</span>
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div className="color-palette">
                    {COLOR_PALETTE.filter(color => {
                      const product = PRODUCT_TEMPLATES.find(p => p.id === activeProduct);
                      return product?.colors.includes(color.name);
                    }).map(color => (
                      <button
                        key={color.name}
                        className={`color-swatch ${selectedColor === color.name ? 'active' : ''}`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => setSelectedColor(color.name)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Product Configuration */}
                <div className="product-config">
                  <div className="config-header-row">
                    <div className="header-item">Item</div>
                    <div className="header-enable">Enable</div>
                    <div className="header-color">Default Color</div>
                  </div>
                  
                  {PRODUCT_TEMPLATES.map(product => (
                    <div key={product.id} className="config-row">
                      <div className="config-item">{product.name}</div>
                      <div className="config-enable">
                        <input
                          type="checkbox"
                          checked={enabledProducts[product.id] || false}
                          onChange={() => toggleProductEnabled(product.id)}
                        />
                      </div>
                      <div className="config-color">
                        <select
                          value={productColors[product.id] || product.colors[0]}
                          onChange={(e) => setProductColors(prev => ({
                            ...prev,
                            [product.id]: e.target.value
                          }))}
                          disabled={!enabledProducts[product.id]}
                        >
                          {product.colors.map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NFC Section */}
              <div className="nfc-section">
                <div className="nfc-header">
                  <h2>🔗 Connect an NFC Experience</h2>
                </div>
                <p className="nfc-subtitle">Turn your product into smart apparel with built-in NFC features.</p>
                
                <div className="nfc-options">
                  <label className="nfc-option">
                    <input
                      type="radio"
                      name="nfc"
                      value="none"
                      checked={nfcExperience === ''}
                      onChange={() => setNfcExperience('')}
                    />
                    <span>No NFC</span>
                  </label>
                  <label className="nfc-option">
                    <input
                      type="radio"
                      name="nfc"
                      value="social"
                      checked={nfcExperience === 'social'}
                      onChange={() => setNfcExperience('social')}
                    />
                    <span>Social Profile</span>
                  </label>
                  <label className="nfc-option">
                    <input
                      type="radio"
                      name="nfc"
                      value="custom"
                      checked={nfcExperience === 'custom'}
                      onChange={() => setNfcExperience('custom')}
                    />
                    <span>Custom Link</span>
                  </label>
                </div>

                {nfcExperience === 'custom' && (
                  <input
                    type="url"
                    placeholder="Enter custom URL"
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    className="nfc-input"
                  />
                )}
              </div>

              <div className="spc-step-actions">
                <button className="spc-btn spc-btn-secondary" onClick={() => setCurrentStep(2)}>
                  ← Back
                </button>
                <button 
                  className="spc-btn spc-btn-primary" 
                  onClick={() => setCurrentStep(4)}
                  disabled={Object.values(enabledProducts).filter(Boolean).length === 0}
                >
                  Continue to Image Generation →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Generate Images */}
          {currentStep === 4 && (
            <div className="spc-step-content active">
              <div className="spc-page-title">Generate Product Images</div>
              <div className="spc-page-subtitle">
                Ready to create {Object.values(enabledProducts).filter(Boolean).length * 6} stunning product mockups
              </div>

              <div className="spc-generation-container">
                {!generatingImages && generationProgress === 0 && (
                  <>
                    <div className="spc-generation-preview">
                      <div className="spc-generation-stats">
                        <div>
                          <span className="spc-stat-number">
                            {Object.values(enabledProducts).filter(Boolean).length}
                          </span>
                          <span className="spc-stat-label">Products</span>
                        </div>
                        <div>
                          <span className="spc-stat-number">6</span>
                          <span className="spc-stat-label">Images Each</span>
                        </div>
                        <div>
                          <span className="spc-stat-number">
                            {Object.values(enabledProducts).filter(Boolean).length * 6}
                          </span>
                          <span className="spc-stat-label">Total Images</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="spc-btn spc-btn-primary spc-btn-large"
                      onClick={generateAllImages}
                    >
                      Generate All Images
                    </button>
                  </>
                )}

                {generatingImages && (
                  <div className="spc-generation-progress">
                    <div className="spc-progress-bar">
                      <div className="spc-progress-fill" style={{ width: `${generationProgress}%` }}></div>
                    </div>
                    <div className="spc-progress-text">Generating... {generationProgress}%</div>
                  </div>
                )}

                {generationProgress === 100 && (
                  <>
                    <div className="spc-generation-complete">
                      <div style={{ fontSize: '48px' }}>✅</div>
                      <div style={{ fontSize: '24px', fontWeight: '600' }}>
                        Images Generated Successfully!
                      </div>
                    </div>
                    <button 
                      className="spc-btn spc-btn-primary"
                      onClick={() => setCurrentStep(5)}
                    >
                      Continue to Publish →
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Publish */}
          {currentStep === 5 && (
            <div className="spc-step-content active">
              <div className="spc-page-title">Publish Your Products</div>
              
              <div className="spc-publish-options">
                <div className="spc-publish-card">
                  <div className="spc-publish-icon">📝</div>
                  <h3>Save as Draft</h3>
                  <button className="spc-btn spc-btn-secondary">Save Draft</button>
                </div>
                <div className="spc-publish-card">
                  <div className="spc-publish-icon">🚀</div>
                  <h3>Publish to Store</h3>
                  <button className="spc-btn spc-btn-primary">Publish Now</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperProductCreatorV2;