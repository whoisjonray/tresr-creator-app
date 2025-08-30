import React, { useState, useRef, useEffect } from 'react';
import { testSuperProductConfig } from '../config/testSuperProductConfig';
import axios from 'axios';
import './SuperProductCreator.css';

function SuperProductCreator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [credits, setCredits] = useState(250);
  
  // Design state
  const [uploadedDesign, setUploadedDesign] = useState(null);
  const [designAnalysis, setDesignAnalysis] = useState(null);
  const [productTitle, setProductTitle] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({
    'tee': true,
    'baby-tee': true,
    'wmn-hoodie': true
  });
  const [currentEditingProduct, setCurrentEditingProduct] = useState('tee');
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Product selection state
  const [selectedFit, setSelectedFit] = useState('Male');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState('black');
  const [currentMockupUrl, setCurrentMockupUrl] = useState(null);
  const [designPosition, setDesignPosition] = useState({ x: 200, y: 180 });
  const [designScale, setDesignScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const designCanvasRef = useRef(null);

  // Get available styles based on selected fit
  const getAvailableStyles = () => {
    if (!testSuperProductConfig.options.style.values[selectedFit.toLowerCase()]) {
      return [];
    }
    return testSuperProductConfig.options.style.values[selectedFit.toLowerCase()];
  };

  // Update mockup URL when style/color changes
  useEffect(() => {
    if (selectedStyle && selectedColor) {
      const baseUrl = `https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments`;
      // Format: garments/{product}_{color}_{side}.png
      const mockupPath = `${selectedStyle.id}_${selectedColor}_front.png`;
      const fullUrl = `${baseUrl}/${mockupPath}`;
      setCurrentMockupUrl(fullUrl);
    }
  }, [selectedStyle, selectedColor]);

  // Initialize with first style when fit changes
  useEffect(() => {
    const styles = getAvailableStyles();
    if (styles.length > 0 && !selectedStyle) {
      setSelectedStyle(styles[0]);
      setSelectedColor(styles[0].colors[0]);
    }
  }, [selectedFit]);

  const products = [
    { id: 'tee', name: 'Medium Weight\nT-Shirt', icon: '👕' },
    { id: 'boxy', name: 'Oversized Drop\nShoulder', icon: '🧥' },
    { id: 'next-crop', name: 'Next Level Crop\nTop', icon: '👚' },
    { id: 'baby-tee', name: 'Ladies Baby Tee', icon: '👕' },
    { id: 'wmn-hoodie', name: "Women's\nIndependent\nHoodie", icon: '🧥' },
    { id: 'med-hood', name: 'Medium Weight\nHoodie', icon: '🧥' },
    { id: 'mediu', name: 'Medium Weight\nSweatshirt', icon: '👔' },
    { id: 'polo', name: 'Standard Polo', icon: '👔' },
    { id: 'patch-c', name: 'Patch Hat -\nCurved', icon: '🧢' },
    { id: 'patch-flat', name: 'Patch Hat - Flat', icon: '🧢' },
    { id: 'mug', name: 'Coffee Mug', icon: '☕' },
    { id: 'art-sqsm', name: 'Art Canvas -\n12x12', icon: '🎨' },
    { id: 'art-sqm', name: 'Art Canvas -\n16x16', icon: '🎨' },
    { id: 'art-lg', name: 'Art Canvas -\n24x24', icon: '🎨' },
    { id: 'nft', name: 'NFTREASURE\nNFT Cards', icon: '🎴' }
  ];

  const backgrounds = [
    { id: 'coffee-shop', name: 'Cozy Coffee Shop', gradient: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F4A460 100%)', conversion: '15.2%', views: '4.5k' },
    { id: 'home-office', name: 'Home Office Morning', gradient: 'linear-gradient(135deg, #E8F4F8 0%, #B8D4E3 50%, #87CEEB 100%)', conversion: '13.7%', views: '3.2k' },
    { id: 'bookstore', name: 'Bookstore Café', gradient: 'linear-gradient(135deg, #704214 0%, #8B4513 50%, #A0522D 100%)', conversion: '11.9%', views: '2.8k' },
    { id: 'kitchen', name: 'Kitchen Counter', gradient: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 50%, #D3D3D3 100%)', conversion: '10.4%', views: '1.9k' }
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        setUploadedDesign(event.target.result);
        
        // Call Gemini AI for analysis (simulated for now)
        try {
          // In production, this would call the actual Gemini API
          // const response = await axios.post('/api/ai/analyze-image', { image: event.target.result });
          
          // Simulated AI response
          setTimeout(() => {
            setDesignAnalysis({
              description: "The design features a grumpy-looking orange cat clutching a coffee mug. Above the cat, \"I LIKE COFFEE\" is displayed, and below, \"I JUST DON'T LIKE DOING THINGS\" is written. The overall mood is humorous and relatable.",
              category: 'Coffee',
              audience: 'Cat lovers, coffee enthusiasts, millennials & Gen Z who appreciate dark humor',
              tags: ['cat', 'coffee', 'humor', 'millennial', 'grumpy'],
              suggestedProducts: ['tee', 'mug', 'hoodie']
            });
            setProductTitle('Grumpy Cat Coffee Lover');
            setCredits(prev => prev - 1);
          }, 1500);
        } catch (error) {
          console.error('AI analysis failed:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const goToStep = (step) => {
    if (step === 1) {
      // Reset everything if going back to step 1
      setUploadedDesign(null);
      setDesignAnalysis(null);
      setSelectedBackground(null);
    }
    setCurrentStep(step);
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const getSelectedCount = () => {
    return Object.values(selectedProducts).filter(Boolean).length;
  };

  // Canvas drawing function
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 600, 600);
    
    // Draw garment background
    if (currentMockupUrl) {
      const garmentImg = new Image();
      garmentImg.onload = () => {
        ctx.drawImage(garmentImg, 0, 0, 600, 600);
        
        // Draw design overlay if uploaded
        if (uploadedDesign) {
          const designImg = new Image();
          designImg.onload = () => {
            const width = 200 * designScale;
            const height = 250 * designScale;
            ctx.drawImage(designImg, designPosition.x - width/2, designPosition.y - height/2, width, height);
          };
          designImg.src = uploadedDesign;
        }
      };
      garmentImg.src = currentMockupUrl;
    }
  };

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [currentMockupUrl, uploadedDesign, designPosition, designScale]);

  // Canvas mouse interaction handlers
  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (600 / rect.width);
    const y = (e.clientY - rect.top) * (600 / rect.height);
    
    // Check if click is on design area
    const designWidth = 200 * designScale;
    const designHeight = 250 * designScale;
    
    if (x >= designPosition.x - designWidth/2 && x <= designPosition.x + designWidth/2 &&
        y >= designPosition.y - designHeight/2 && y <= designPosition.y + designHeight/2) {
      setIsDragging(true);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (600 / rect.width);
    const y = (e.clientY - rect.top) * (600 / rect.height);
    
    setDesignPosition({ x, y });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const generateImages = async () => {
    setGeneratingImages(true);
    setGenerationProgress(0);
    
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
    
    setCredits(prev => prev - 30);
    
    // In production, this would call the actual image generation API
    // const selectedProductsList = Object.entries(selectedProducts)
    //   .filter(([_, enabled]) => enabled)
    //   .map(([id]) => id);
    // await axios.post('/api/generate-mockups', { 
    //   products: selectedProductsList,
    //   design: uploadedDesign,
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
          <div className={`spc-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`} onClick={() => currentStep > 1 && goToStep(1)}>
            <div className="spc-step-number">{currentStep > 1 ? '✓' : '1'}</div>
            <div className="spc-step-label">Upload Design</div>
          </div>
          <div className={`spc-step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`} onClick={() => currentStep > 2 && goToStep(2)}>
            <div className="spc-step-number">{currentStep > 2 ? '✓' : '2'}</div>
            <div className="spc-step-label">Select Background</div>
          </div>
          <div className={`spc-step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`} onClick={() => currentStep > 3 && goToStep(3)}>
            <div className="spc-step-number">{currentStep > 3 ? '✓' : '3'}</div>
            <div className="spc-step-label">Configure Products</div>
          </div>
          <div className={`spc-step ${currentStep === 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`} onClick={() => currentStep > 4 && goToStep(4)}>
            <div className="spc-step-number">{currentStep > 4 ? '✓' : '4'}</div>
            <div className="spc-step-label">Generate Images</div>
          </div>
          <div className={`spc-step ${currentStep === 5 ? 'active' : ''}`}>
            <div className="spc-step-number">5</div>
            <div className="spc-step-label">Publish</div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="spc-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

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
          <div className="spc-menu-item">
            <span>📊</span>
            <span>Analytics</span>
          </div>
          <div className="spc-menu-item">
            <span>📚</span>
            <span>Library</span>
          </div>
          <div className="spc-menu-item">
            <span>🚀</span>
            <span>Bulk Create</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="spc-content">
          <div className="spc-step-wrapper">
            {/* Step 1: Upload Design */}
            {currentStep === 1 && (
              <div className="spc-step-content active">
                <div className="spc-page-title">Upload Your Design</div>
                <div className="spc-page-subtitle">Start by uploading your design for AI analysis</div>

                <div className="spc-upload-section">
                  {/* Upload Options */}
                  <div className="spc-upload-options">
                    <button className="spc-btn spc-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                      📤 Upload File
                    </button>
                    <div className="spc-or">OR</div>
                    <button className="spc-btn spc-btn-secondary">
                      📚 Select from Library
                    </button>
                  </div>

                  {/* Upload Box */}
                  <div className="spc-upload-box" onClick={() => !uploadedDesign && fileInputRef.current?.click()}>
                    {!uploadedDesign ? (
                      <div className="spc-upload-prompt">
                        <div style={{ fontSize: '48px' }}>📤</div>
                        <div style={{ fontSize: '16px', marginTop: '8px' }}>Drop your design here</div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                          or click to browse • PNG, JPG, SVG up to 10MB
                        </div>
                      </div>
                    ) : (
                      <div className="spc-uploaded-image">
                        <img src={uploadedDesign} alt="Uploaded design" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />

                  {/* AI Analysis */}
                  {designAnalysis && (
                    <div className="spc-ai-analysis">
                      <div className="spc-ai-header">
                        <span style={{ fontSize: '24px' }}>✨</span>
                        <div style={{ fontSize: '18px', fontWeight: '600' }}>AI Design Analysis</div>
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
                            <select value={designAnalysis.category} onChange={() => {}}>
                              <option>Coffee</option>
                              <option>Crypto/Web3</option>
                              <option>Cat Lovers</option>
                              <option>Mental Health</option>
                            </select>
                          </div>
                          <div className="spc-field-row">
                            <label>Target Audience</label>
                            <div className="spc-field-input">
                              <div style={{ flex: 1 }}>{designAnalysis.audience}</div>
                              <button className="spc-refresh-btn" title="Regenerate audience (1 credit)">
                                🔄
                              </button>
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
                </div>
              </div>
            )}

            {/* Step 2: Background Selection */}
            {currentStep === 2 && (
              <div className="spc-step-content active">
                <div className="spc-page-title">Choose Your Background</div>
                <div className="spc-page-subtitle">Select a lifestyle background that matches your design's vibe</div>

                <div className="spc-backgrounds-container">
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
                              src={currentMockupUrl || "https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/tee_black_front.png"}
                              style={{ width: '60%', height: 'auto', zIndex: 10, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                              alt="T-shirt preview"
                            />
                            {uploadedDesign && (
                              <img 
                                src={uploadedDesign}
                                style={{ 
                                  position: 'absolute', 
                                  width: '25%', 
                                  height: 'auto',
                                  zIndex: 11
                                }}
                                alt="Design preview"
                              />
                            )}
                          </div>
                        </div>
                        <div className="spc-background-info">
                          <div className="spc-background-name">{bg.name}</div>
                          <div className="spc-background-stats">
                            <span>📈 <span style={{ color: '#10b981', fontWeight: '600' }}>{bg.conversion}</span></span>
                            <span>👁️ <span style={{ color: '#10b981', fontWeight: '600' }}>{bg.views}</span> views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

            {/* Step 3: Configure Products */}
            {currentStep === 3 && (
              <div className="spc-step-content active">
                <div className="spc-page-title">Configure Products</div>

                <div className="spc-configure-section">
                  {/* Product Selection Grid */}
                  <div className="spc-products-grid-container">
                    <div className="spc-products-grid">
                      {products.map(product => (
                        <div 
                          key={product.id}
                          className={`spc-product-card ${selectedProducts[product.id] ? 'selected' : ''} ${currentEditingProduct === product.id ? 'currently-editing' : ''}`}
                          onClick={() => {
                            toggleProduct(product.id);
                            setCurrentEditingProduct(product.id);
                          }}
                        >
                          {currentEditingProduct === product.id && (
                            <div className="spc-product-editing-badge">Currently Editing</div>
                          )}
                          {selectedProducts[product.id] && <div className="spc-product-check">✓</div>}
                          <div className="spc-product-icon">{product.icon}</div>
                          <div className="spc-product-name" dangerouslySetInnerHTML={{ __html: product.name.replace(/\n/g, '<br>') }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Canvas and Product Details */}
                  <div className="spc-configure-columns">
                    {/* Canvas Editor */}
                    <div className="spc-canvas-section">
                      <div className="spc-canvas-container">
                        <canvas 
                          ref={canvasRef}
                          width={600}
                          height={600}
                          style={{ width: '100%', height: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          onMouseLeave={handleCanvasMouseUp}
                        />
                      </div>
                      <div className="spc-canvas-controls">
                        <div className="spc-canvas-tools">
                          <span>Tools</span>
                          <button className="active">Move</button>
                          <button>Rotate</button>
                          <button>🔍</button>
                          <button>🗑️</button>
                          <button>⚙️</button>
                        </div>
                        <div className="spc-canvas-scale">
                          <span>Scale</span>
                          <input 
                            type="range" 
                            min="50" 
                            max="150" 
                            value={designScale * 100}
                            onChange={(e) => setDesignScale(e.target.value / 100)}
                          />
                          <input 
                            type="number" 
                            value={Math.round(designScale * 100)}
                            onChange={(e) => setDesignScale(e.target.value / 100)}
                          />
                          <span>%</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Details Table */}
                    <div className="spc-product-details">
                      <div className="spc-product-options">
                        <div className="spc-option-group">
                          <label>Fit</label>
                          <div className="spc-fit-buttons">
                            <button 
                              className={selectedFit === 'Male' ? 'active' : ''}
                              onClick={() => {
                                setSelectedFit('Male');
                                const maleStyles = testSuperProductConfig.options.style.values.male;
                                if (maleStyles.length > 0) {
                                  setSelectedStyle(maleStyles[0]);
                                  setSelectedColor(maleStyles[0].colors[0]);
                                }
                              }}
                            >
                              Male
                            </button>
                            <button 
                              className={selectedFit === 'Female' ? 'active' : ''}
                              onClick={() => {
                                setSelectedFit('Female');
                                const femaleStyles = testSuperProductConfig.options.style.values.female;
                                if (femaleStyles.length > 0) {
                                  setSelectedStyle(femaleStyles[0]);
                                  setSelectedColor(femaleStyles[0].colors[0]);
                                }
                              }}
                            >
                              Female
                            </button>
                          </div>
                        </div>
                        
                        <div className="spc-option-group">
                          <label>Style</label>
                          <select 
                            value={selectedStyle?.id || ''}
                            onChange={(e) => {
                              const style = getAvailableStyles().find(s => s.id === e.target.value);
                              setSelectedStyle(style);
                              if (style && !style.colors.includes(selectedColor)) {
                                setSelectedColor(style.colors[0]);
                              }
                            }}
                          >
                            {getAvailableStyles().map(style => (
                              <option key={style.id} value={style.id}>
                                {style.name} - ${style.price}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="spc-option-group">
                          <label>Color</label>
                          <div className="spc-color-grid">
                            {selectedStyle?.colors.map(color => (
                              <button
                                key={color}
                                className={`spc-color-swatch ${selectedColor === color ? 'active' : ''}`}
                                style={{ 
                                  background: color === 'black' ? '#000' : 
                                           color === 'white' ? '#fff' : 
                                           color === 'navy' ? '#001f3f' :
                                           color === 'cardinal-red' ? '#990000' :
                                           color === 'heather-grey' ? '#9b9b9b' :
                                           color === 'natural' ? '#f5f5dc' : '#ccc',
                                  border: color === 'white' ? '1px solid #ddd' : 'none'
                                }}
                                onClick={() => setSelectedColor(color)}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="spc-step-actions">
                  <button className="spc-btn spc-btn-secondary" onClick={() => setCurrentStep(2)}>
                    ← Back
                  </button>
                  <button 
                    className="spc-btn spc-btn-primary" 
                    onClick={() => setCurrentStep(4)}
                    disabled={getSelectedCount() === 0}
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
                  Ready to create {getSelectedCount() * 6} stunning product mockups
                </div>

                <div className="spc-generation-container">
                  {!generatingImages && generationProgress === 0 && (
                    <>
                      <div className="spc-generation-preview">
                        <div className="spc-generation-stats">
                          <div>
                            <span className="spc-stat-number">{getSelectedCount()}</span>
                            <span className="spc-stat-label">Products</span>
                          </div>
                          <div>
                            <span className="spc-stat-number">6</span>
                            <span className="spc-stat-label">Images Each</span>
                          </div>
                          <div>
                            <span className="spc-stat-number">{getSelectedCount() * 6}</span>
                            <span className="spc-stat-label">Total Images</span>
                          </div>
                        </div>
                      </div>
                      <div className="spc-generation-cost">
                        <div className="spc-cost-breakdown">
                          <span>Generation Cost:</span>
                          <span className="spc-cost-amount">30 Credits</span>
                        </div>
                        <div className="spc-credits-remaining">
                          Your balance: {credits} credits
                        </div>
                      </div>
                      <button 
                        className="spc-btn spc-btn-primary spc-btn-large"
                        onClick={generateImages}
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
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
                          Images Generated Successfully!
                        </div>
                        <div style={{ color: '#9ca3af' }}>
                          All {getSelectedCount() * 6} product mockups have been created
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

                <div className="spc-step-actions">
                  <button className="spc-btn spc-btn-secondary" onClick={() => setCurrentStep(3)}>
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Publish */}
            {currentStep === 5 && (
              <div className="spc-step-content active">
                <div className="spc-page-title">Publish Your Products</div>
                <div className="spc-page-subtitle">Your products are ready to go live!</div>

                <div className="spc-publish-container">
                  <div className="spc-publish-options">
                    <div className="spc-publish-card">
                      <div className="spc-publish-icon">📝</div>
                      <h3>Save as Draft</h3>
                      <p>Save your work and come back later to finish</p>
                      <button className="spc-btn spc-btn-secondary">Save Draft</button>
                    </div>
                    <div className="spc-publish-card">
                      <div className="spc-publish-icon">🚀</div>
                      <h3>Publish to Store</h3>
                      <p>Make your products live immediately</p>
                      <button className="spc-btn spc-btn-primary">Publish Now</button>
                    </div>
                  </div>
                </div>

                <div className="spc-step-actions">
                  <button className="spc-btn spc-btn-secondary" onClick={() => setCurrentStep(4)}>
                    ← Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperProductCreator;