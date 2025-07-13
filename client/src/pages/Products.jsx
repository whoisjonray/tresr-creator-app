import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Products.css';
import { userStorage } from '../utils/userStorage';

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Forest King',
    description: 'A majestic lion in a magical forest setting',
    mockups: [
      { id: 1, type: 'Classic T-Shirt', color: 'Black', price: 22, image: 'https://via.placeholder.com/300x400/000000/ffffff?text=Classic+Tee' },
      { id: 2, type: 'Pullover Hoodie', color: 'Navy', price: 42, image: 'https://via.placeholder.com/300x400/000080/ffffff?text=Hoodie' },
      { id: 3, type: 'Ceramic Mug', color: 'White', price: 15, image: 'https://via.placeholder.com/300x400/ffffff/000000?text=Mug' }
    ],
    variants: 384,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Ocean Dreams',
    description: 'Peaceful waves and sunset vibes',
    mockups: [
      { id: 4, type: 'Classic T-Shirt', color: 'White', price: 22, image: 'https://via.placeholder.com/300x400/ffffff/000000?text=Classic+Tee' },
      { id: 5, type: 'Tank Top', color: 'Blue', price: 20, image: 'https://via.placeholder.com/300x400/0000ff/ffffff?text=Tank+Top' }
    ],
    variants: 256,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

function Products() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load products from localStorage or API
    const savedProducts = userStorage.getProducts();
    if (savedProducts && savedProducts.length > 0) {
      setProducts(savedProducts);
    }
  }, []);

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
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Your Products</h1>
        <Link to="/design-editor" className="btn-create-new">
          + Create New Design
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <h2>No products yet</h2>
          <p>Create your first design to see it here!</p>
          <Link to="/design-editor" className="btn-primary">
            Create Design
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-mockups">
                {product.mockups.slice(0, 3).map((mockup, index) => (
                  <div 
                    key={mockup.id} 
                    className={`mockup-preview mockup-${index}`}
                    style={{ 
                      backgroundImage: `url(${mockup.image})`,
                      zIndex: 3 - index 
                    }}
                  />
                ))}
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
                    onClick={() => window.location.href = `/design-editor?edit=${product.id}`}
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
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;