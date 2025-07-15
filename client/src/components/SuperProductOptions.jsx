import React, { useState, useEffect } from 'react';
import MockupPreview from './MockupPreview';
import { getStylesForFit, getStyleById, getGarmentImageUrl, getSummaryStats } from '../config/testSuperProductConfig';
import './SuperProductOptions.css';

function SuperProductOptions({ superProduct, onSelectionChange, onAddToCart }) {
  const [selectedFit, setSelectedFit] = useState('Male'); // Default to Male
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [availableStyles, setAvailableStyles] = useState([]);

  // Update available styles when fit changes
  useEffect(() => {
    if (selectedFit) {
      const stylesForFit = getStylesForFit(selectedFit);
      setAvailableStyles(stylesForFit);
      
      // Reset style selection when fit changes
      if (stylesForFit.length > 0) {
        setSelectedStyle(stylesForFit[0]);
      } else {
        setSelectedStyle(null);
      }
    }
  }, [selectedFit]);

  // Update dependent options when style changes
  useEffect(() => {
    if (selectedStyle) {
      // Reset dependent selections
      setSelectedColor(selectedStyle.colors[0]);
      setSelectedSize(selectedStyle.sizes[0]);
      setCurrentPrice(parseFloat(selectedStyle.price));
    }
  }, [selectedStyle]);

  // Notify parent of selection changes
  useEffect(() => {
    if (selectedFit && selectedStyle && selectedColor && selectedSize) {
      const selection = {
        fit: selectedFit,
        style: selectedStyle,
        color: selectedColor,
        size: selectedSize,
        price: currentPrice
      };
      
      onSelectionChange?.(selection);
    }
  }, [selectedFit, selectedStyle, selectedColor, selectedSize, currentPrice, onSelectionChange]);

  const handleAddToCart = async () => {
    if (!selectedFit || !selectedStyle || !selectedColor || !selectedSize) {
      alert('Please select all required options');
      return;
    }

    setIsAddingToCart(true);
    try {
      const selection = {
        fit: selectedFit,
        style: selectedStyle,
        color: selectedColor,
        size: selectedSize,
        price: currentPrice
      };

      await onAddToCart?.(selection);
      
      // Show success feedback
      const button = document.getElementById('add-to-cart-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Added to Cart!';
        button.classList.add('success');
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('success');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (!superProduct) {
    return <div className="loading-options">Loading product options...</div>;
  }

  return (
    <div className="super-product-options">
      
      {/* Fit Selector */}
      <div className="option-group">
        <h3 className="option-title">Choose Fit</h3>
        <div className="fit-buttons">
          {['Male', 'Female'].map(fit => (
            <button
              key={fit}
              className={`option-button fit-button ${selectedFit === fit ? 'selected' : ''}`}
              onClick={() => setSelectedFit(fit)}
            >
              {fit}
              <span className="fit-count">
                ({getStylesForFit(fit).length} styles)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Style Selector */}
      {availableStyles.length > 0 && (
        <div className="option-group">
          <h3 className="option-title">Choose Style</h3>
          <div className="style-grid">
            {availableStyles.map(style => (
              <div 
                key={style.id}
                className={`style-option ${selectedStyle?.id === style.id ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(style)}
              >
                <div className="style-mockup">
                  <img 
                    src={getGarmentImageUrl(style.id, selectedColor || style.colors[0], 'front') || '/images/placeholder-garment.png'}
                    alt={`${style.name} - ${selectedColor || style.colors[0]}`}
                    width={120}
                    height={160}
                    onError={(e) => {
                      e.target.src = '/images/placeholder-garment.png';
                    }}
                  />
                </div>
                <div className="style-info">
                  <span className="style-name">{style.name}</span>
                  <span className="style-price">${style.price}</span>
                  <span className="style-colors">
                    {style.colors.length} colors
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {selectedStyle && (
        <div className="option-group">
          <h3 className="option-title">Color</h3>
          <div className="color-grid">
            {selectedStyle.colors.map(color => (
              <div
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                onClick={() => setSelectedColor(color)}
                title={color}
              >
                <div className="color-mockup">
                  <img 
                    src={getGarmentImageUrl(selectedStyle.id, color, 'front') || '/images/placeholder-garment.png'}
                    alt={`${selectedStyle.name} - ${color}`}
                    width={80}
                    height={100}
                    onError={(e) => {
                      e.target.src = '/images/placeholder-garment.png';
                    }}
                  />
                </div>
                <span className="color-name">{color.replace('-', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {selectedStyle && (
        <div className="option-group">
          <h3 className="option-title">Size</h3>
          <div className="size-buttons">
            {selectedStyle.sizes.map(size => (
              <button
                key={size}
                className={`option-button size-button ${selectedSize === size ? 'selected' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Link */}
      {selectedStyle && ['classic-tee', 'hoodie', 'premium-tee'].includes(selectedStyle.id) && (
        <div className="size-guide">
          <button className="size-guide-link" onClick={() => window.open('/pages/size-guide', '_blank')}>
            📏 Size Guide
          </button>
        </div>
      )}

      {/* Add to Cart Section */}
      <div className="add-to-cart-section">
        <div className="price-display">
          <span className="current-price">${currentPrice}</span>
          {selectedStyle && (
            <span className="price-note">
              + shipping calculated at checkout
            </span>
          )}
        </div>
        
        <button 
          id="add-to-cart-btn"
          className="btn-add-to-cart"
          onClick={handleAddToCart}
          disabled={isAddingToCart || !selectedFit || !selectedStyle || !selectedColor || !selectedSize}
        >
          {isAddingToCart ? (
            <>
              <span className="loading-spinner"></span>
              Adding to Cart...
            </>
          ) : (
            'Add to Cart'
          )}
        </button>

        {/* Selection Summary */}
        {selectedFit && selectedStyle && selectedColor && selectedSize && (
          <div className="selection-summary">
            <span>
              {selectedFit} • {selectedStyle.name} • {selectedColor.replace('-', ' ')} • {selectedSize}
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="product-details-section">
        <div className="detail-tabs">
          <button className="detail-tab active">Description</button>
          <button className="detail-tab">Shipping</button>
          <button className="detail-tab">Returns</button>
        </div>
        
        <div className="detail-content">
          <div className="detail-panel active">
            <p>{superProduct.description}</p>
            {selectedStyle && (
              <div className="style-details">
                <h4>{selectedStyle.name} Details:</h4>
                <ul>
                  <li>High-quality print on premium material</li>
                  <li>Available in {selectedStyle.colors.length} colors</li>
                  <li>Sizes from {selectedStyle.sizes[0]} to {selectedStyle.sizes[selectedStyle.sizes.length - 1]}</li>
                  {selectedStyle.fits && <li>Available in {selectedStyle.fits.join(' and ')} fits</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for showing main product image with dynamic updates
function SuperProductImage({ superProduct, selectedStyle, selectedColor }) {
  if (!selectedStyle || !selectedColor) {
    return (
      <div className="product-image-placeholder">
        <img src={superProduct.designImage} alt={superProduct.title} />
      </div>
    );
  }

  const garmentImageUrl = getGarmentImageUrl(selectedStyle.id, selectedColor, 'front');

  return (
    <div className="super-product-image">
      <img 
        src={garmentImageUrl || '/images/placeholder-garment.png'}
        alt={`${selectedStyle.name} - ${selectedColor}`}
        width={400}
        height={500}
        className="main-mockup"
        onError={(e) => {
          e.target.src = '/images/placeholder-garment.png';
        }}
      />
      {/* Design overlay can be added here with canvas compositing */}
    </div>
  );
}

// Component for showing related accessories
function RelatedAccessories({ designId, accessories = [] }) {
  if (!accessories.length) return null;

  return (
    <div className="related-accessories">
      <h3 className="accessories-title">Complete the Look</h3>
      <div className="accessories-grid">
        {accessories.map(accessory => (
          <div key={accessory.id} className="accessory-card">
            <div className="accessory-image">
              <img 
                src={getGarmentImageUrl(accessory.id, accessory.colors[0], 'front') || '/images/placeholder-accessory.png'}
                alt={accessory.name}
                width={120}
                height={120}
                onError={(e) => {
                  e.target.src = '/images/placeholder-accessory.png';
                }}
              />
            </div>
            <div className="accessory-info">
              <h4 className="accessory-name">{accessory.name}</h4>
              <p className="accessory-price">${accessory.price}</p>
              <p className="accessory-colors">
                {accessory.colors.length} color{accessory.colors.length !== 1 ? 's' : ''}
              </p>
              <button 
                className="btn-view-accessory"
                onClick={() => {
                  // Navigate to individual accessory product page
                  window.open(`/products/${accessory.id}-${designId}`, '_blank');
                }}
              >
                View Product
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SuperProductOptions;
export { SuperProductImage, RelatedAccessories };