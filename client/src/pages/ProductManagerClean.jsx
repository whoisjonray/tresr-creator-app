import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { userStorage } from '../utils/userStorage';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load products from database for logged-in users
  const loadProductsFromDatabase = async () => {
    if (user && user.id) {
      try {
        console.log('Loading products from database for user:', user.id);
        const response = await api.get('/api/designs/my-designs');
        console.log('Loaded from database:', response.data.designs);
        setProducts(response.data.designs);
      } catch (error) {
        console.error('Failed to load products from database:', error);
        // Fallback to localStorage if database fails
        const storedProducts = userStorage.getProducts();
        setProducts(storedProducts);
      }
    } else {
      // Not logged in, use localStorage
      console.log('No user logged in, using localStorage');
      const storedProducts = userStorage.getProducts();
      setProducts(storedProducts);
    }
  };

  useEffect(() => {
    // Load products on mount
    loadProductsFromDatabase();
  }, [user]);

  useEffect(() => {
    // Check if we're coming back from the design editor with a new/updated product
    if (location.state?.newProduct) {
      console.log('New product from editor:', location.state.newProduct);
      const newProduct = location.state.newProduct;
      setProducts(prevProducts => {
        const existingIndex = prevProducts.findIndex(p => p.id === newProduct.id);
        if (existingIndex >= 0) {
          // Update existing product
          const updated = [...prevProducts];
          updated[existingIndex] = newProduct;
          return updated;
        } else {
          // Add new product
          return [...prevProducts, newProduct];
        }
      });
      
      // Clear the location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this design?')) {
      try {
        // If user is logged in, delete from database
        if (user && user.id) {
          await api.delete(`/api/designs/${productId}`);
        }
        
        // Remove from state
        setProducts(products.filter(p => p.id !== productId));
        
        // Also update localStorage
        const updatedProducts = products.filter(p => p.id !== productId);
        localStorage.setItem('userProducts', JSON.stringify(updatedProducts));
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete design. Please try again.');
      }
    }
  };

  const handlePublishToShopify = async (productId) => {
    alert('Publishing to Shopify coming soon!');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all designs? This cannot be undone.')) {
      userStorage.clearProducts();
      setProducts([]);
    }
  };

  // Fix raw images function
  const handleFixRawImages = async () => {
    setImporting(true);
    setImportProgress('🎨 Fixing design images to use RAW PNG files...');
    
    try {
      const response = await fetch('/api/fix/fix-with-cloudinary-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Fix failed');
      }
      
      const result = await response.json();
      
      setImportProgress(`✅ ${result.message}`);
      console.log('Fix complete:', result);
      
      // Reload after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Fix raw images error:', error);
      setImportProgress(`❌ Error: ${error.message}`);
      setTimeout(() => {
        setImporting(false);
        setImportProgress('');
      }, 3000);
    }
  };

  const canImport = user && user.id;

  return (
    <div className="product-manager">
      <div className="page-header">
        <div>
          <h1>Your Products</h1>
        </div>
        <div className="header-actions">
          {/* Single clean button to fix raw images */}
          {canImport && (
            <button 
              onClick={handleFixRawImages}
              className="btn-fix-raw" 
              disabled={importing}
              style={{
                marginRight: '10px', 
                background: importing ? '#9ca3af' : '#10b981', 
                color: 'white', 
                padding: '8px 16px', 
                border: 'none', 
                borderRadius: '4px',
                cursor: importing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {importing ? '🎨 Fixing...' : '🎨 FIX RAW IMAGES'}
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
                      margin: '0 auto'
                    }}
                  />
                ) : (
                  // Placeholder if no image
                  <div 
                    className="mockup-preview mockup-0"
                    style={{
                      background: '#f5f5f5',
                      border: '2px dashed #ddd',
                      borderRadius: '8px',
                      width: '180px',
                      height: '240px',
                      minHeight: '240px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      top: '20px',
                      margin: '0 auto',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <span style={{fontSize: '48px'}}>📦</span>
                    <span style={{color: '#888', fontSize: '14px'}}>No Preview Available</span>
                  </div>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name || product.title || 'Untitled Design'}</h3>
                <div className="product-stats">
                  <span>{product.products_count || 0} Products</span>
                  <span className="status-badge">
                    {product.published_to_shopify ? 'published' : 'draft'}
                  </span>
                </div>
                <div className="product-actions">
                  <Link to={`/design/${product.id}/edit`} className="btn-edit">
                    Edit
                  </Link>
                  <button 
                    onClick={() => handlePublishToShopify(product.id)} 
                    className="btn-publish"
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Publish to Shopify
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default ProductManager;