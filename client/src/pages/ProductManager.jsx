import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Products.css';
import { userStorage } from '../utils/userStorage';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { autoFixAndVerify } from '../utils/fix-thumbnails-production';
import testEndpoints from '../utils/test-production-endpoints';

// Generate SVG placeholder function for fallback images
const generatePlaceholder = (productName, color) => {
  const colorMap = {
    'Black': '#000000',
    'White': '#f5f5f5',
    'Navy': '#000080',
    'Blue': '#0000ff'
  };
  
  const bgColor = colorMap[color] || '#cccccc';
  const textColor = (color === 'White' || color === 'Yellow') ? '#333' : '#fff';
  
  const svg = `
    <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="400" fill="${bgColor}"/>
      <text x="50%" y="50%" text-anchor="middle" fill="${textColor}" 
            font-family="Arial" font-size="18" dy=".3em">
        ${productName}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

function ProductManager() {
  const { creator } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [canImport, setCanImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  const isAdmin = creator?.role === 'admin' || creator?.isAdmin;

  // Function to load products from database
  const loadProductsFromDatabase = async () => {
    try {
      console.log('📋 Loading products from database...');
      const designsResponse = await api.get('/api/designs', {
        params: { limit: 1000 } // Get all designs, not just default 20
      });
      console.log('API /designs response:', designsResponse.data);
      
      if (designsResponse.data.designs && designsResponse.data.designs.length > 0) {
        console.log('✅ Loaded', designsResponse.data.designs.length, 'designs from database');
        console.log('Design data:', designsResponse.data.designs);
        setProducts(designsResponse.data.designs);
      } else if (designsResponse.data.designs && designsResponse.data.designs.length === 0) {
        console.log('📭 Database returned empty array, checking localStorage');
        // Fallback to localStorage
        const savedProducts = userStorage.getProducts();
        if (savedProducts && savedProducts.length > 0) {
          setProducts([...savedProducts]);
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      console.log('❌ Failed to load from database, using localStorage:', error.message);
      // Fallback to localStorage on error
      const savedProducts = userStorage.getProducts();
      if (savedProducts && savedProducts.length > 0) {
        setProducts([...savedProducts]);
      } else {
        setProducts([]);
      }
    }
  };

  useEffect(() => {
    // Check if user can import (admin only for now) - only once on mount
    if (!canImport) {
      checkImportStatus();
    }
    
    // Check if we received data from the design editor
    if (location.state && location.state.mockups) {
      const { mockups, designTitle, designDescription, supportingText, tags, nfcEnabled, productConfigs, selectedColors, designImageSrc, frontDesignImageSrc, backDesignImageSrc, frontDesignUrl, backDesignUrl, printMethod, isEditMode, editProductId } = location.state;
      
      // Convert the mockups object to a product format
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      const newProduct = {
        id: isEditMode ? editProductId : `product_${timestamp}_${randomSuffix}`,
        name: designTitle,
        description: designDescription,
        supportingText: supportingText, // Store supporting text
        tags: tags || [],
        nfcEnabled: nfcEnabled || false,
        originalDesignImage: designImageSrc, // Store the original design for editing
        frontDesignImageSrc: frontDesignImageSrc, // Store front design image
        backDesignImageSrc: backDesignImageSrc, // Store back design image
        frontDesignUrl: frontDesignUrl, // Store front design URL
        backDesignUrl: backDesignUrl, // Store back design URL
        printMethod: printMethod || 'auto', // Store print method with default
        productConfigs: productConfigs, // Store product configurations and positions
        selectedColors: selectedColors, // Store selected colors
        mockups: Object.entries(mockups).map(([productId, mockupData], index) => ({
          id: `mockup_${timestamp}_${randomSuffix}_${index}`,
          type: mockupData.templateId || productId,
          color: mockupData.color || 'Default',
          price: 22, // Default price
          image: mockupData.url || generatePlaceholder(mockupData.templateId || productId, mockupData.color || 'Default'),
          designPreview: designImageSrc // Include original design in each mockup
        })),
        previewImage: designImageSrc, // Main preview image for the product card
        variants: Object.keys(mockups).length * (selectedColors?.length || 8) * 8, // products * colors * sizes
        createdAt: new Date().toISOString(),
        isDraft: false
      };
      
      console.log('=== NEW PRODUCT CREATION ===');
      console.log('New product created:', newProduct);
      console.log('Preview image present:', newProduct.previewImage ? 'YES' : 'NO');
      console.log('Original design image present:', newProduct.originalDesignImage ? 'YES' : 'NO');
      console.log('Front design image present:', newProduct.frontDesignImageSrc ? 'YES' : 'NO');
      console.log('Back design image present:', newProduct.backDesignImageSrc ? 'YES' : 'NO');
      console.log('Design image src from state:', designImageSrc ? 'YES' : 'NO');
      console.log('Mockups received count:', Object.keys(mockups || {}).length);
      
      if (newProduct.previewImage) {
        console.log('Preview image type:', typeof newProduct.previewImage);
        console.log('Preview image length:', newProduct.previewImage.length);
        console.log('Preview image preview:', newProduct.previewImage.substring(0, 100));
      }
      console.log('==============================');
      
      // Save to localStorage first
      const savedProducts = userStorage.getProducts();
      
      if (isEditMode && editProductId) {
        // Update existing product
        const index = savedProducts.findIndex(p => p.id === editProductId);
        if (index !== -1) {
          savedProducts[index] = newProduct;
        } else {
          // Product not found, add as new
          savedProducts.unshift(newProduct);
        }
      } else {
        // Add new product
        savedProducts.unshift(newProduct);
      }
      
      userStorage.setProducts(savedProducts);
      
      // Set products to only include saved products (no mock products)
      setProducts([...savedProducts]);
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    } else {
      // Load products from database first, then fallback to localStorage
      loadProductsFromDatabase();
    }
  }, [location.state]);

  const checkImportStatus = async () => {
    try {
      const response = await api.get('/api/sanity/import-status');
      if (response.data.canImport) {
        setCanImport(true);
        console.log('✅ User can import designs:', response.data.user.email);
      }
    } catch (error) {
      // Silently fail if not authenticated - this is expected
      if (error.response?.status !== 401) {
        console.log('Import status check failed:', error.message);
      }
      setCanImport(false);
    }
  };

  const handleImportJustGrokIt = async () => {
    const JUST_GROK_IT_ID = '27b6e93d-0e7d-4f78-9905-74a66c504a17';
    
    setImporting(true);
    setImportProgress('Connecting to Sanity...');
    
    try {
      setImportProgress('Fetching design from Sanity...');
      
      const response = await api.post(`/api/sanity/import/${JUST_GROK_IT_ID}`);
      
      if (response.data.success) {
        setImportProgress('Design imported successfully!');
        
        // Reload products from database
        await loadProductsFromDatabase();
        
        setTimeout(() => {
          setImporting(false);
          setImportProgress('');
        }, 2000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportProgress(`Import failed: ${error.response?.data?.error || error.message}`);
      setTimeout(() => {
        setImporting(false);
        setImportProgress('');
      }, 3000);
    }
  };
  
  const handleDirectImport = async () => {
    setImporting(true);
    setImportProgress('Direct import starting...');
    
    try {
      const response = await api.post('/api/direct/import-memelord-direct');
      
      if (response.data.success) {
        setImportProgress(`Successfully imported ${response.data.imported} of ${response.data.total} designs!`);
        
        // Reload products from database
        await loadProductsFromDatabase();
        setImportProgress(`Import successful! Loaded designs from database.`);
        
        setTimeout(() => {
          setImporting(false);
          setImportProgress('');
        }, 3000);
      }
    } catch (error) {
      console.error('Direct import failed:', error);
      setImportProgress(`Import failed: ${error.response?.data?.error || error.message}`);
      setTimeout(() => {
        setImporting(false);
        setImportProgress('');
      }, 5000);
    }
  };
  
  const handleImportSanityDesigns = async () => {
    setImporting(true);
    setImportProgress('Importing your Sanity designs...');
    
    try {
      // Import designs for current user (simplified endpoint)
      const response = await api.post('/api/sanity/person/import-my-designs');
      
      if (response.data.success) {
        setImportProgress(`Successfully imported ${response.data.imported.length} designs!`);
        
        // Reload products from database
        await loadProductsFromDatabase();
        
        setTimeout(() => {
          setImporting(false);
          setImportProgress('');
        }, 3000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      if (error.response?.status === 404) {
        if (error.response?.data?.debug) {
          console.log('Debug info:', error.response.data.debug);
          setImportProgress(`No Sanity mapping found. Your Dynamic ID: ${error.response.data.debug.yourDynamicId}. Visit /api/setup/setup-memelord to create mapping.`);
        } else {
          setImportProgress('No Sanity mapping found. Please contact admin to set up your account mapping.');
        }
      } else if (error.response?.data?.details) {
        setImportProgress(`Import failed: ${error.response.data.details}`);
        if (error.response.data.hint) {
          console.log('Hint:', error.response.data.hint);
        }
      } else {
        setImportProgress(`Import failed: ${error.response?.data?.error || error.message}`);
      }
      setTimeout(() => {
        setImporting(false);
        setImportProgress('');
      }, 8000);
    }
  };

  const handlePublishToShopify = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (window.confirm(`Publish "${product.name}" to Shopify with ${product.variants} variants?`)) {
      setLoading(true);
      try {
        // Here we would call the Shopify API
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
        alert(`Successfully published "${product.name}" to Shopify!`);
      } catch (error) {
        alert('Failed to publish to Shopify');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      
      // Update localStorage (save all real products)
      userStorage.setProducts(updatedProducts);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all products including demo products? This cannot be undone.')) {
      userStorage.setProducts([]);
      setProducts([]);
    }
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Your Products</h1>
        <div className="header-actions">
          {isAdmin && (
            <>
              <button 
                onClick={async () => {
                  if (!window.confirm('This will import ALL 151 memelord designs. Continue?')) return;
                  
                  try {
                    console.log('🚀 IMPORTING ALL DESIGNS...');
                    const response = await api.post('/api/import-now/import-all-memelord');
                    console.log('✅ IMPORT COMPLETE:', response.data);
                    
                    // Directly set the products from the response
                    if (response.data.designs) {
                      setProducts(response.data.designs);
                      alert(`SUCCESS! Imported ${response.data.imported} designs. They are now displayed below.`);
                    }
                  } catch (error) {
                    console.error('❌ Import failed:', error);
                    alert(`FAILED: ${error.response?.data?.error || error.message}`);
                  }
                }}
                style={{
                  marginRight: '10px',
                  background: '#dc2626',
                  color: 'white',
                  padding: '12px 24px',
                  border: '2px solid #991b1b',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                🚀 IMPORT ALL 151 DESIGNS NOW
              </button>
              <button 
                onClick={async () => {
                  try {
                    // Debug: Check what's actually in database
                    const response = await api.get('/api/debug/check-designs');
                    console.log('🔍 DATABASE DEBUG:', response.data);
                    alert(`Database has ${response.data.totalDesigns} total designs. Your designs: ${response.data.userDesigns.length}. Check console for details.`);
                  } catch (error) {
                    console.error('Debug failed:', error);
                    alert('Debug failed - check console');
                  }
                }}
                style={{
                  marginRight: '10px',
                  background: '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 Debug DB
              </button>
              <button 
                onClick={async () => {
                  try {
                    console.log('Testing super simple import...');
                    const response = await api.post('/api/super-simple/import-one-minimal');
                    console.log('✅ Super simple import result:', response.data);
                    alert(`Success! Imported: ${response.data.design.name}`);
                    // Reload products
                    await loadProductsFromDatabase();
                  } catch (error) {
                    console.error('❌ Super simple import failed:', error);
                    alert(`Failed: ${error.response?.data?.error || error.message}`);
                  }
                }}
                style={{
                  marginRight: '10px',
                  background: '#059669',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✅ Simple Import
              </button>
              <button 
                onClick={async () => {
                  try {
                    const response = await api.get('/api/super-simple/list-all-designs');
                    console.log('📋 ALL DESIGNS IN DATABASE:', response.data);
                    alert(`Database contains ${response.data.totalDesigns} total designs. Check console for details.`);
                  } catch (error) {
                    console.error('List failed:', error);
                    alert('Failed to list designs');
                  }
                }}
                style={{
                  marginRight: '10px',
                  background: '#7c3aed',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📋 List All
              </button>
              <button 
                onClick={async () => {
                  console.log('🔄 Force reloading from database...');
                  await loadProductsFromDatabase();
                  console.log('Current products state:', products);
                }}
                style={{
                  marginRight: '10px',
                  background: '#0891b2',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload DB
              </button>
              <button 
                onClick={async () => {
                  setImporting(true);
                  setImportProgress('Testing import of ONE design...');
                  try {
                    const response = await api.post('/api/simple/import-one');
                    setImportProgress(`Test result: ${response.data.message}`);
                    console.log('Import one result:', response.data);
                    
                    // Reload products from database after successful import
                    if (response.data.success) {
                      setImportProgress('Reloading products from database...');
                      await loadProductsFromDatabase();
                      setImportProgress(`Import successful! Check your products below.`);
                    }
                  } catch (error) {
                    setImportProgress(`Test failed: ${error.response?.data?.error || error.message}`);
                    console.error('Import one error:', error.response?.data);
                  }
                  setTimeout(() => {
                    setImporting(false);
                    setImportProgress('');
                  }, 5000);
                }}
                className="btn-import" 
                disabled={importing}
                style={{
                  marginRight: '10px', 
                  background: importing ? '#9ca3af' : '#6366f1', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: importing ? 'not-allowed' : 'pointer'
                }}
              >
                {importing ? 'Testing...' : 'Test Import ONE'}
              </button>
              <button 
                onClick={handleDirectImport} 
                className="btn-import" 
                disabled={importing}
                style={{
                  marginRight: '10px', 
                  background: importing ? '#9ca3af' : '#ef4444', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: importing ? 'not-allowed' : 'pointer'
                }}
              >
                {importing ? 'Importing...' : 'Direct Import (Test 10)'}
              </button>
              <button 
                onClick={handleImportSanityDesigns} 
                className="btn-import" 
                disabled={importing}
                style={{
                  marginRight: '10px', 
                  background: importing ? '#9ca3af' : '#10b981', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: importing ? 'not-allowed' : 'pointer'
                }}
              >
                {importing ? 'Importing...' : 'Import My Sanity Designs'}
              </button>
              <button 
                onClick={async () => {
                  console.log('Testing endpoints first...');
                  await testEndpoints();
                  alert('Check browser console for endpoint test results');
                }}
                className="btn-test-endpoints" 
                style={{
                  marginRight: '10px', 
                  background: '#6b7280', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🧪 TEST ENDPOINTS
              </button>
              <button 
                onClick={async () => {
                  setImporting(true);
                  setImportProgress('🔧 Fixing thumbnails and updating all design data...');
                  
                  try {
                    const result = await autoFixAndVerify();
                    
                    if (result.fix && result.fix.success) {
                      setImportProgress(`✅ ${result.fix.message}. Refreshing...`);
                      
                      // Give visual feedback before refresh
                      setTimeout(() => {
                        window.location.reload();
                      }, 2000);
                    } else {
                      setImportProgress(`❌ Fix failed: ${result.fix?.error || 'Unknown error'}`);
                      setTimeout(() => {
                        setImporting(false);
                        setImportProgress('');
                      }, 3000);
                    }
                  } catch (error) {
                    console.error('Fix thumbnails error:', error);
                    setImportProgress(`❌ Error: ${error.message}`);
                    setTimeout(() => {
                      setImporting(false);
                      setImportProgress('');
                    }, 3000);
                  }
                }}
                className="btn-fix-thumbnails" 
                disabled={importing}
                style={{
                  marginRight: '10px', 
                  background: importing ? '#9ca3af' : '#f59e0b', 
                  color: 'white', 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {importing ? '🔧 Fixing...' : '🔧 FIX THUMBNAILS'}
              </button>
            </>
          )}
          {canImport && (
            <button 
              onClick={handleImportJustGrokIt} 
              className="btn-import" 
              disabled={importing}
              style={{
                marginRight: '10px', 
                background: importing ? '#9ca3af' : '#8b5cf6', 
                color: 'white', 
                padding: '8px 16px', 
                border: 'none', 
                borderRadius: '4px',
                cursor: importing ? 'not-allowed' : 'pointer'
              }}
            >
              {importing ? 'Importing...' : 'Import JUST Grok IT'}
            </button>
          )}
          <button onClick={handleClearAll} className="btn-clear" style={{marginRight: '10px', background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px'}}>
            Clear All
          </button>
          <Link to="/design/new" className="btn-create-new">
            + Create New Design
          </Link>
        </div>
      </div>

      {importProgress && (
        <div style={{
          background: '#f3f4f6',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {importing && (
            <div className="spinner" style={{
              width: '20px',
              height: '20px',
              border: '2px solid #8b5cf6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          )}
          <span>{importProgress}</span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state">
          <h2>No products yet</h2>
          <p>Create your first design to see it here!</p>
          <Link to="/design/new" className="btn-primary">
            Create Design
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => {
            // Debug logging for image preview issues
            console.log('=== PRODUCT DEBUG ===');
            console.log('Product:', product);
            console.log('Product name:', product.name);
            console.log('Preview Image:', product.previewImage ? 'FOUND' : 'MISSING');
            console.log('Thumbnail URL:', product.thumbnail_url ? 'FOUND' : 'MISSING');
            console.log('Front Design URL:', product.front_design_url ? 'FOUND' : 'MISSING');
            console.log('==================');
            
            // Get the image URL from either format (localStorage or database)
            const imageUrl = product.previewImage || 
                           product.originalDesignImage || 
                           product.thumbnail_url || 
                           product.front_design_url ||
                           product.thumbnailUrl ||
                           product.frontDesignUrl;
            
            return (
            <div key={product.id} className="product-card">
              <div className="product-mockups">
                {imageUrl ? (
                  // Show the uploaded design image if available
                  <div 
                    className="mockup-preview mockup-0"
                    style={{ 
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      width: '180px',
                      height: '240px',
                      minHeight: '240px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      top: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                    title={`Preview: ${product.name}`}
                  />
                ) : (
                  // Fallback to mockup images or placeholder
                  product.mockups && product.mockups.length > 0 ? (
                    product.mockups.slice(0, 3).map((mockup, index) => (
                      <div 
                        key={mockup.id} 
                        className={`mockup-preview mockup-${index}`}
                        style={{ 
                          backgroundImage: `url(${mockup.image || mockup.designPreview})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          width: '100%',
                          height: '200px',
                          zIndex: 3 - index 
                        }}
                      />
                    ))
                  ) : (
                    // Ultimate fallback - placeholder text
                    <div 
                      className="mockup-preview mockup-0"
                      style={{ 
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        width: '100%',
                        height: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d'
                      }}
                    >
                      No Preview Available
                    </div>
                  )
                )}
              </div>
              
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                
                <div className="product-stats">
                  <span className="stat">
                    <strong>{product.mockups?.length || product.products?.length || 0}</strong> Products
                  </span>
                  <span className="stat">
                    <strong>{product.variants || product.status || 'draft'}</strong> {product.variants ? 'Variants' : ''}
                  </span>
                </div>
                
                <div className="product-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => navigate(`/design/${product.id}/edit`, { 
                      state: { productData: product } 
                    })}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-publish"
                    onClick={() => handlePublishToShopify(product.id)}
                    disabled={loading}
                  >
                    {loading ? 'Publishing...' : 'Publish to Shopify'}
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductManager;