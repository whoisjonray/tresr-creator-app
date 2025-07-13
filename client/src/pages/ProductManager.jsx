import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Products.css';

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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we received data from the design editor
    if (location.state && location.state.mockups) {
      const { mockups, designTitle, designDescription, supportingText, tags, nfcEnabled, productConfigs, selectedColors, designImageSrc, frontDesignImageSrc, backDesignImageSrc, frontDesignUrl, backDesignUrl, isEditMode, editProductId } = location.state;
      
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
      const savedProducts = JSON.parse(localStorage.getItem('generatedProducts') || '[]');
      
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
      
      localStorage.setItem('generatedProducts', JSON.stringify(savedProducts));
      
      // Set products to only include saved products (no mock products)
      setProducts([...savedProducts]);
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    } else {
      // Load products from localStorage or API
      const savedProducts = localStorage.getItem('generatedProducts');
      if (savedProducts) {
        try {
          const parsed = JSON.parse(savedProducts);
          setProducts([...parsed]);
        } catch (error) {
          console.error('Error parsing saved products:', error);
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    }
  }, [location.state]);

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
      localStorage.setItem('generatedProducts', JSON.stringify(updatedProducts));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all products including demo products? This cannot be undone.')) {
      localStorage.removeItem('generatedProducts');
      setProducts([]);
    }
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Your Products</h1>
        <div className="header-actions">
          <button onClick={handleClearAll} className="btn-clear" style={{marginRight: '10px', background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px'}}>
            Clear All
          </button>
          <Link to="/design/new" className="btn-create-new">
            + Create New Design
          </Link>
        </div>
      </div>

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
            console.log('Product name:', product.name);
            console.log('Preview Image:', product.previewImage ? 'FOUND' : 'MISSING');
            console.log('Original Design Image:', product.originalDesignImage ? 'FOUND' : 'MISSING');
            console.log('Mockups count:', product.mockups?.length || 0);
            if (product.previewImage) {
              console.log('Preview Image length:', product.previewImage.length);
              console.log('Preview Image starts with:', product.previewImage.substring(0, 50));
            }
            if (product.originalDesignImage) {
              console.log('Original Design Image length:', product.originalDesignImage.length);
              console.log('Original Design Image starts with:', product.originalDesignImage.substring(0, 50));
            }
            console.log('==================');
            
            return (
            <div key={product.id} className="product-card">
              <div className="product-mockups">
                {product.previewImage || product.originalDesignImage ? (
                  // Show the uploaded design image if available
                  <div 
                    className="mockup-preview mockup-0"
                    style={{ 
                      backgroundImage: `url(${product.previewImage || product.originalDesignImage})`,
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
                    <strong>{product.mockups.length}</strong> Products
                  </span>
                  <span className="stat">
                    <strong>{product.variants}</strong> Variants
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