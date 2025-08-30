import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import './SuperProductCreator.css';

function SuperProductCreator() {
  const { creator } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [credits, setCredits] = useState(200);
  
  // Design state
  const [uploadedDesign, setUploadedDesign] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [designPosition, setDesignPosition] = useState({ x: 150, y: 150, scale: 1 });
  const canvasRef = useRef(null);
  
  // Product configuration
  const [productConfig, setProductConfig] = useState({
    'tee': { enabled: true, name: 'Medium Weight T-Shirt' },
    'boxy': { enabled: false, name: 'Oversized Drop Shoulder' },
    'next-crop': { enabled: false, name: 'Next Level Crop Top' },
    'baby-tee': { enabled: true, name: 'Ladies Baby Tee' },
    'wmn-hoodie': { enabled: true, name: "Women's Independent Hoodie" },
    'med-hood': { enabled: false, name: 'Medium Weight Hoodie' },
    'mediu': { enabled: false, name: 'Medium Weight Sweatshirt' },
    'polo': { enabled: false, name: 'Standard Polo' },
    'patch-c': { enabled: false, name: 'Patch Hat - Curved' },
    'patch-flat': { enabled: false, name: 'Patch Hat - Flat' },
    'mug': { enabled: false, name: 'Coffee Mug' },
    'art-sqsm': { enabled: false, name: 'Art Canvas - 12x12' },
    'art-sqm': { enabled: false, name: 'Art Canvas - 16x16' },
    'art-lg': { enabled: false, name: 'Art Canvas - 24x24' },
    'nft': { enabled: false, name: 'NFTREASURE NFT Cards' }
  });

  const [generatingMockups, setGeneratingMockups] = useState(false);
  const [mockupsGenerated, setMockupsGenerated] = useState(false);

  const steps = [
    { id: 1, name: 'Upload Design', icon: '📁' },
    { id: 2, name: 'Choose Background', icon: '🎨' },
    { id: 3, name: 'Configure Products', icon: '⚙️' },
    { id: 4, name: 'Generate & Review', icon: '🖼️' },
    { id: 5, name: 'Publish', icon: '🚀' }
  ];

  const backgrounds = [
    { id: 'cozy-morning', name: 'Cozy Morning', icon: '☕' },
    { id: 'home-office', name: 'Home Office', icon: '💻' },
    { id: 'urban-street', name: 'Urban Street', icon: '🏙️' },
    { id: 'minimalist', name: 'Minimalist', icon: '⬜' }
  ];

  useEffect(() => {
    drawCanvas();
  }, [uploadedDesign, designPosition]);

  const drawCanvas = () => {
    if (!canvasRef.current || !uploadedDesign) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw design
    const img = new Image();
    img.onload = () => {
      const { x, y, scale } = designPosition;
      const width = img.width * scale;
      const height = img.height * scale;
      ctx.drawImage(img, x - width/2, y - height/2, width, height);
    };
    img.src = uploadedDesign;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedDesign(event.target.result);
        setCurrentStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleProduct = (productId) => {
    setProductConfig(prev => ({
      ...prev,
      [productId]: { ...prev[productId], enabled: !prev[productId].enabled }
    }));
  };

  const getEnabledProductCount = () => {
    return Object.values(productConfig).filter(p => p.enabled).length;
  };

  const generateMockups = () => {
    if (credits < 30) {
      alert('Not enough credits!');
      return;
    }
    
    setGeneratingMockups(true);
    setTimeout(() => {
      setGeneratingMockups(false);
      setMockupsGenerated(true);
      setCredits(prev => prev - 30);
      setCurrentStep(5);
    }, 3000);
  };

  const goToStep = (step) => {
    if (step === 1) {
      setUploadedDesign(null);
      setSelectedBackground(null);
      setMockupsGenerated(false);
    }
    setCurrentStep(step);
  };

  return (
    <div className="spc-container">
      {/* Header */}
      <div className="spc-header">
        <div className="spc-logo">
          <span>💎</span>
          <span>TRESR Creator</span>
        </div>
        <div className="spc-credit-balance">
          <div className="spc-credits">
            💰 {credits} Credits
          </div>
          <button className="spc-btn-buy-credits">Buy Credits</button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="spc-progress-container">
        <div className="spc-progress-steps">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`spc-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              onClick={() => step.id < currentStep && goToStep(step.id)}
            >
              <div className="spc-step-number">
                {currentStep > step.id ? '✓' : step.icon}
              </div>
              <div className="spc-step-name">{step.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="spc-main">
        {/* Sidebar */}
        <div className={`spc-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="spc-sidebar-header">
            <h3>Navigation</h3>
            <button onClick={() => setSidebarOpen(false)}>×</button>
          </div>
          <nav className="spc-nav">
            <a href="/dashboard">Dashboard</a>
            <a href="/design/new" className="active">Create Design</a>
            <a href="/products">Products</a>
            <a href="/analytics">Analytics</a>
            <a href="/settings">Settings</a>
          </nav>
        </div>

        {/* Content Area */}
        <div className="spc-content">
          {/* Step 1: Upload Design */}
          {currentStep === 1 && (
            <div className="spc-step-content">
              <h2>Upload Your Design</h2>
              <p>Start by uploading your design image. We support PNG, JPG, and SVG formats.</p>
              
              <div className="spc-upload-area">
                <input 
                  type="file" 
                  id="design-upload" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="design-upload" className="spc-upload-box">
                  <div className="spc-upload-icon">📁</div>
                  <div className="spc-upload-text">
                    Click to browse or drag and drop your design here
                  </div>
                  <button className="spc-btn-primary">Choose File</button>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Choose Background */}
          {currentStep === 2 && (
            <div className="spc-step-content">
              <h2>Choose Your Background</h2>
              <p>Select a lifestyle background that matches your design's vibe</p>
              
              <div className="spc-backgrounds">
                {backgrounds.map(bg => (
                  <div 
                    key={bg.id}
                    className={`spc-background-card ${selectedBackground === bg.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBackground(bg.id)}
                  >
                    <div className="spc-background-preview">{bg.icon}</div>
                    <div className="spc-background-name">{bg.name}</div>
                  </div>
                ))}
              </div>

              <div className="spc-actions">
                <button onClick={() => setCurrentStep(1)} className="spc-btn-secondary">← Back</button>
                <button 
                  onClick={() => setCurrentStep(3)} 
                  className="spc-btn-primary"
                  disabled={!selectedBackground}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Configure Products */}
          {currentStep === 3 && (
            <div className="spc-step-content">
              <h2>Configure Products</h2>
              <p>Select which products you want to create with your design</p>
              
              <div className="spc-split-layout">
                <div className="spc-canvas-section">
                  <canvas 
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="spc-canvas"
                  />
                  <div className="spc-canvas-controls">
                    <label>Scale: </label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2" 
                      step="0.1"
                      value={designPosition.scale}
                      onChange={(e) => setDesignPosition(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    />
                    <span>{Math.round(designPosition.scale * 100)}%</span>
                  </div>
                </div>

                <div className="spc-products-section">
                  <div className="spc-products-grid">
                    {Object.entries(productConfig).slice(0, 8).map(([id, product]) => (
                      <div 
                        key={id}
                        className={`spc-product-card ${product.enabled ? 'enabled' : ''}`}
                        onClick={() => toggleProduct(id)}
                      >
                        {product.enabled && <div className="spc-product-badge">✓</div>}
                        <div className="spc-product-icon">👕</div>
                        <div className="spc-product-name">{product.name}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="spc-product-count">
                    {getEnabledProductCount()} products selected
                  </div>
                </div>
              </div>

              <div className="spc-actions">
                <button onClick={() => setCurrentStep(2)} className="spc-btn-secondary">← Back</button>
                <button 
                  onClick={() => setCurrentStep(4)} 
                  className="spc-btn-primary"
                  disabled={getEnabledProductCount() === 0}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Generate & Review */}
          {currentStep === 4 && (
            <div className="spc-step-content">
              <h2>Generate Mockups</h2>
              <p>Ready to create {getEnabledProductCount() * 6} product mockups</p>
              
              <div className="spc-generate-section">
                {!mockupsGenerated ? (
                  <>
                    <div className="spc-cost-info">
                      <div>Cost: 30 credits</div>
                      <div>Your balance: {credits} credits</div>
                    </div>
                    <button 
                      onClick={generateMockups} 
                      className="spc-btn-primary spc-btn-large"
                      disabled={generatingMockups}
                    >
                      {generatingMockups ? 'Generating...' : 'Generate Mockups'}
                    </button>
                  </>
                ) : (
                  <div className="spc-mockups-preview">
                    <div className="spc-mockup-grid">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="spc-mockup-card">
                          <div className="spc-mockup-image">👕</div>
                          <div className="spc-mockup-title">Product Mockup {i}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setCurrentStep(5)} className="spc-btn-primary">
                      Continue to Publish →
                    </button>
                  </div>
                )}
              </div>

              <div className="spc-actions">
                <button onClick={() => setCurrentStep(3)} className="spc-btn-secondary">← Back</button>
              </div>
            </div>
          )}

          {/* Step 5: Publish */}
          {currentStep === 5 && (
            <div className="spc-step-content">
              <h2>Publish Your Products</h2>
              <p>Your products are ready! Choose how you want to publish them.</p>
              
              <div className="spc-publish-options">
                <div className="spc-publish-card">
                  <h3>Save as Draft</h3>
                  <p>Save your work and come back later</p>
                  <button className="spc-btn-secondary">Save Draft</button>
                </div>
                
                <div className="spc-publish-card">
                  <h3>Publish to Store</h3>
                  <p>Make your products live immediately</p>
                  <button className="spc-btn-primary">Publish Now</button>
                </div>
              </div>

              <div className="spc-actions">
                <button onClick={() => setCurrentStep(4)} className="spc-btn-secondary">← Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperProductCreator;