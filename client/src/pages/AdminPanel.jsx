import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('products');
  const [productTemplates, setProductTemplates] = useState([]);
  const [colorPalette, setColorPalette] = useState([]);
  const [garmentStatus, setGarmentStatus] = useState(null);
  const [newProduct, setNewProduct] = useState({
    id: '',
    name: '',
    templateId: '',
    price: 0,
    colors: [],
    category: 'apparel',
    baseImage: ''
  });
  const [newColor, setNewColor] = useState({
    name: '',
    hex: '',
    filterCSS: ''
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'garments') {
      loadGarmentStatus();
    }
  }, [activeTab]);

  const loadGarmentStatus = async () => {
    try {
      const response = await fetch('/api/admin/garments/status');
      const data = await response.json();
      setGarmentStatus(data);
    } catch (error) {
      console.error('Failed to load garment status:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load current templates and colors from API
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      setProductTemplates(data.productTemplates || []);
      setColorPalette(data.colorPalette || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      // Fallback to hardcoded data
      setProductTemplates([
        { id: 'classic-tee', name: 'Classic T-Shirt', templateId: 'tshirt_front', price: 22, colors: ['Black', 'White', 'Navy'], category: 'apparel', baseImage: '/garments/tshirt-base.png' },
        { id: 'hoodie', name: 'Pullover Hoodie', templateId: 'hoodie_front', price: 42, colors: ['Black', 'White', 'Navy'], category: 'apparel', baseImage: '/garments/hoodie-base.png' },
        { id: 'mug', name: 'Ceramic Mug', templateId: 'mug_wrap', price: 15, colors: ['White'], category: 'drinkware', baseImage: '/garments/mug-base.png' }
      ]);
      setColorPalette([
        { name: 'Black', hex: '#000000', filterCSS: 'brightness(0.3)' },
        { name: 'White', hex: '#FFFFFF', filterCSS: 'brightness(1.2)' },
        { name: 'Navy', hex: '#000080', filterCSS: 'hue-rotate(220deg) saturate(1.5) brightness(0.4)' }
      ]);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.templateId) return;
    
    const productToAdd = {
      ...newProduct,
      id: newProduct.id || newProduct.name.toLowerCase().replace(/\s+/g, '-')
    };

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productToAdd)
      });

      if (response.ok) {
        setProductTemplates([...productTemplates, productToAdd]);
        setNewProduct({
          id: '', name: '', templateId: '', price: 0, colors: [], category: 'apparel', baseImage: ''
        });
      }
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const handleAddColor = async () => {
    if (!newColor.name || !newColor.hex) return;

    try {
      const response = await fetch('/api/admin/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColor)
      });

      if (response.ok) {
        setColorPalette([...colorPalette, newColor]);
        setNewColor({ name: '', hex: '', filterCSS: '' });
      }
    } catch (error) {
      console.error('Failed to add color:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product template?')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProductTemplates(productTemplates.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleDeleteColor = async (colorName) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;

    try {
      const response = await fetch(`/api/admin/colors/${colorName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setColorPalette(colorPalette.filter(c => c.name !== colorName));
      }
    } catch (error) {
      console.error('Failed to delete color:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>TRESR Admin Panel</h1>
        <p>Manage product templates, colors, and system settings</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Product Templates
        </button>
        <button 
          className={activeTab === 'colors' ? 'active' : ''}
          onClick={() => setActiveTab('colors')}
        >
          Color Palette
        </button>
        <button 
          className={activeTab === 'garments' ? 'active' : ''}
          onClick={() => setActiveTab('garments')}
        >
          Garment Images
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          System Settings
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="admin-section">
          <h2>Product Templates</h2>
          
          <div className="add-product-form">
            <h3>Add New Product Template</h3>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Product Name (e.g., Classic T-Shirt)"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Template ID (e.g., tshirt_front)"
                value={newProduct.templateId}
                onChange={(e) => setNewProduct({...newProduct, templateId: e.target.value})}
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
              />
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              >
                <option value="apparel">Apparel</option>
                <option value="drinkware">Drinkware</option>
                <option value="accessories">Accessories</option>
                <option value="home">Home & Living</option>
              </select>
              <input
                type="text"
                placeholder="Base Image Path (e.g., /garments/tshirt-base.png)"
                value={newProduct.baseImage}
                onChange={(e) => setNewProduct({...newProduct, baseImage: e.target.value})}
              />
              <button onClick={handleAddProduct} className="btn-add">
                Add Product Template
              </button>
            </div>
          </div>

          <div className="products-list">
            <h3>Current Product Templates ({productTemplates.length})</h3>
            <div className="products-grid">
              {productTemplates.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-preview">
                    {product.baseImage ? (
                      <img src={product.baseImage} alt={product.name} />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p>ID: {product.id}</p>
                    <p>Template: {product.templateId}</p>
                    <p>Price: ${product.price}</p>
                    <p>Category: {product.category}</p>
                    <p>Colors: {product.colors?.length || 0}</p>
                  </div>
                  <div className="product-actions">
                    <button onClick={() => handleDeleteProduct(product.id)} className="btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'colors' && (
        <div className="admin-section">
          <h2>Color Palette</h2>
          
          <div className="add-color-form">
            <h3>Add New Color</h3>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Color Name (e.g., Forest Green)"
                value={newColor.name}
                onChange={(e) => setNewColor({...newColor, name: e.target.value})}
              />
              <input
                type="color"
                value={newColor.hex}
                onChange={(e) => setNewColor({...newColor, hex: e.target.value})}
              />
              <input
                type="text"
                placeholder="CSS Filter (optional - for fallback)"
                value={newColor.filterCSS}
                onChange={(e) => setNewColor({...newColor, filterCSS: e.target.value})}
              />
              <button onClick={handleAddColor} className="btn-add">
                Add Color
              </button>
            </div>
          </div>

          <div className="colors-list">
            <h3>Current Color Palette ({colorPalette.length})</h3>
            <div className="colors-grid">
              {colorPalette.map(color => (
                <div key={color.name} className="color-card">
                  <div 
                    className="color-swatch" 
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <div className="color-info">
                    <h4>{color.name}</h4>
                    <p>Hex: {color.hex}</p>
                    <p>Filter: {color.filterCSS}</p>
                  </div>
                  <div className="color-preview">
                    <div 
                      className="filter-preview"
                      style={{ 
                        backgroundColor: '#cccccc',
                        filter: color.filterCSS
                      }}
                    ></div>
                  </div>
                  <button onClick={() => handleDeleteColor(color.name)} className="btn-delete-small">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'garments' && (
        <div className="admin-section">
          <h2>Garment Images</h2>
          
          <div className="garment-status">
            <h3>Pre-Rendered Garment Status</h3>
            <p>Using Cloudinary-hosted images from TRESR.com migration</p>
            
            <div className="garment-grid">
              <div className="status-card">
                <h4>✅ Configured Products</h4>
                {garmentStatus && garmentStatus.configured ? (
                  <ul>
                    {garmentStatus.configured.map(product => (
                      <li key={product.id}>{product.name} ({product.colors} colors)</li>
                    ))}
                  </ul>
                ) : (
                  <p>Loading...</p>
                )}
              </div>
              
              <div className="status-card">
                <h4>⚠️ Missing Images</h4>
                {garmentStatus && garmentStatus.missing ? (
                  <ul>
                    {garmentStatus.missing.map(productId => (
                      <li key={productId}>{productId} - No images uploaded</li>
                    ))}
                  </ul>
                ) : (
                  <p>Loading...</p>
                )}
              </div>
              
              <div className="status-card">
                <h4>📊 Statistics</h4>
                {garmentStatus ? (
                  <>
                    <p>Total Garment Images: {garmentStatus.totalImages}</p>
                    <p>Storage Used: {garmentStatus.storageUsed}</p>
                    <p>Average Load Time: 0.2s</p>
                    <p>CDN: {garmentStatus.cdn}</p>
                  </>
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="btn-primary"
                onClick={() => alert('Upload functionality would open a file picker to upload garment images for missing products')}
              >
                Upload Missing Images
              </button>
              <button 
                className="btn-secondary"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/garments/sync', { method: 'POST' });
                    const data = await response.json();
                    alert(data.message || 'Sync initiated');
                    loadGarmentStatus();
                  } catch (error) {
                    alert('Failed to sync: ' + error.message);
                  }
                }}
              >
                Re-sync from Sanity
              </button>
              <button 
                className="btn-secondary"
                onClick={() => window.open('https://cloudinary.com/console', '_blank')}
              >
                View Cloudinary Dashboard
              </button>
            </div>
          </div>
          
          <div className="print-areas">
            <h3>Print Area Configuration</h3>
            <p>Adjust the print boundaries for each product type</p>
            <div className="info-box">
              <p>Print areas are now configured per product type:</p>
              <ul>
                <li>T-shirts: 200x286px centered chest area</li>
                <li>Hoodies: 200x260px slightly lower placement</li>
                <li>Hats: 120-140x80px small centered area</li>
                <li>Canvas: 360x360px near-full coverage</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="admin-section">
          <h2>System Settings</h2>
          
          <div className="settings-group">
            <h3>Mockup System</h3>
            <div className="setting-item">
              <label>
                <input type="radio" name="mockupSystem" value="prerendered" defaultChecked />
                Pre-Rendered Images (Best Quality - $0 per generation)
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="radio" name="mockupSystem" value="css" />
                CSS-Based Mockups (Fallback - $0 per generation)
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="radio" name="mockupSystem" value="api" />
                Dynamic Mockups API (Professional - $0.10-0.50 per generation)
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h3>Creator Tool Settings</h3>
            <div className="setting-item">
              <label>Max Design File Size (MB):</label>
              <input type="number" defaultValue="5" />
            </div>
            <div className="setting-item">
              <label>Allowed File Types:</label>
              <input type="text" defaultValue="PNG, JPG, SVG" />
            </div>
          </div>

          <div className="settings-group">
            <h3>Cost Analysis</h3>
            <div className="cost-comparison">
              <div className="cost-item">
                <h4>Pre-Rendered Images</h4>
                <p>Cost: $5/month (Cloudinary)</p>
                <p>Per Generation: $0</p>
                <p className="savings">Best Quality & Performance</p>
              </div>
              <div className="cost-item">
                <h4>CSS Filter System</h4>
                <p>Cost: $0/month</p>
                <p>Per Generation: $0</p>
                <p>Quality: 85-95% accuracy</p>
              </div>
              <div className="cost-item">
                <h4>Dynamic Mockups API</h4>
                <p>Estimated Cost: $500-2000+/month</p>
                <p>Per Generation: $0.10-0.50</p>
                <p className="warning">High Volume Risk</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;