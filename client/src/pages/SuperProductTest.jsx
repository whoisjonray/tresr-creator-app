import React, { useState, useEffect } from 'react';
import SuperProductOptions, { SuperProductImage, RelatedAccessories } from '../components/SuperProductOptions';
import { testSuperProductConfig, getSummaryStats } from '../config/testSuperProductConfig';
import './SuperProductTest.css';

function SuperProductTest() {
  const [selection, setSelection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectionChange = (newSelection) => {
    setSelection(newSelection);
    console.log('Selection changed:', newSelection);
  };

  const handleAddToCart = async (selection) => {
    setIsLoading(true);
    
    try {
      // Simulate API call to add to cart
      console.log('Adding to cart:', selection);
      
      // Mock cart API call
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selection.style.id,
          fit: selection.fit,
          color: selection.color,
          size: selection.size,
          price: selection.price,
          quantity: 1
        })
      }).catch(() => {
        // Mock success for testing
        return { ok: true };
      });

      if (response.ok) {
        console.log('Successfully added to cart');
      } else {
        throw new Error('Failed to add to cart');
      }
      
    } catch (error) {
      console.error('Cart error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const stats = getSummaryStats();

  return (
    <div className="superproduct-test-page">
      <div className="test-header">
        <h1>SuperProduct Test - Complete Collection</h1>
        <div className="test-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.totalStyles}</span>
            <span className="stat-label">Total Styles</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.maleStyles}</span>
            <span className="stat-label">Male Styles</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.femaleStyles}</span>
            <span className="stat-label">Female Styles</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.totalColors}</span>
            <span className="stat-label">Color Options</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.accessories}</span>
            <span className="stat-label">Accessories</span>
          </div>
        </div>
      </div>

      <div className="superproduct-container">
        <div className="product-image-section">
          <SuperProductImage
            superProduct={testSuperProductConfig}
            selectedStyle={selection?.style}
            selectedColor={selection?.color}
          />
        </div>

        <div className="product-options-section">
          <SuperProductOptions
            superProduct={testSuperProductConfig}
            onSelectionChange={handleSelectionChange}
            onAddToCart={handleAddToCart}
            hideAddToCart={true}
          />
        </div>
      </div>

      {/* Related Accessories */}
      <RelatedAccessories
        designId={testSuperProductConfig.id}
        accessories={testSuperProductConfig.accessories}
      />

      {/* Debug Information */}
      {selection && (
        <div className="debug-section">
          <h3>Debug Information</h3>
          <div className="debug-card">
            <h4>Current Selection</h4>
            <pre>{JSON.stringify(selection, null, 2)}</pre>
          </div>
          <div className="debug-card">
            <h4>Shopify Product Mapping</h4>
            <div className="product-mapping">
              <p><strong>Main SuperProduct ID:</strong> 9901220888861</p>
              <p><strong>Selected Style ID:</strong> {selection.style?.id}</p>
              <p><strong>Shopify Product URL:</strong> https://auth.0xtresr.com/products/test-design-complete-collection-{selection.style?.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Testing Instructions */}
      <div className="testing-instructions">
        <h3>Testing Instructions</h3>
        <div className="instruction-grid">
          <div className="instruction-card">
            <h4>🧪 Fit Testing</h4>
            <ul>
              <li>Click "Male" → Should show 5 style options</li>
              <li>Click "Female" → Should show 2 style options</li>
              <li>Verify style counts in buttons</li>
            </ul>
          </div>
          <div className="instruction-card">
            <h4>🎨 Color Testing</h4>
            <ul>
              <li>Select different styles → Colors should update</li>
              <li>Click color options → Image should change</li>
              <li>Verify real Cloudinary images load</li>
            </ul>
          </div>
          <div className="instruction-card">
            <h4>💰 Price Testing</h4>
            <ul>
              <li>Switch styles → Price should update immediately</li>
              <li>Check: T-Shirt ($22) → Hoodie ($45) → Sweatshirt ($38)</li>
              <li>Verify selection summary updates</li>
            </ul>
          </div>
          <div className="instruction-card">
            <h4>🛒 Cart Testing</h4>
            <ul>
              <li>Make full selection → Add to Cart button enables</li>
              <li>Click Add to Cart → Check console logs</li>
              <li>Verify correct product ID in debug section</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperProductTest;