import React, { useState, useEffect } from 'react';
import MockupPreview from './MockupPreview';
import './SuperProductOptions.css';

function SuperProductOptions({ superProduct, onSelectionChange, onAddToCart }) {
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedFit, setSelectedFit] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Initialize with first available options
  useEffect(() => {
    if (superProduct?.options?.style?.values?.length > 0) {
      const firstStyle = superProduct.options.style.values[0];
      setSelectedStyle(firstStyle);
    }
  }, [superProduct]);

  // Update dependent options when style changes
  useEffect(() => {
    if (selectedStyle) {
      // Reset dependent selections
      setSelectedFit(selectedStyle.fits?.[0] || null);
      setSelectedColor(selectedStyle.colors[0]);
      setSelectedSize(selectedStyle.sizes[0]);
      setCurrentPrice(selectedStyle.price);
    }
  }, [selectedStyle]);

  // Notify parent of selection changes
  useEffect(() => {
    if (selectedStyle && selectedColor && selectedSize) {
      const selection = {
        style: selectedStyle,
        fit: selectedFit,
        color: selectedColor,
        size: selectedSize,
        price: currentPrice
      };
      
      onSelectionChange?.(selection);
    }
  }, [selectedStyle, selectedFit, selectedColor, selectedSize, currentPrice, onSelectionChange]);

  const handleAddToCart = async () => {
    if (!selectedStyle || !selectedColor || !selectedSize) {
      alert('Please select all required options');
      return;
    }

    setIsAddingToCart(true);
    try {
      const selection = {
        style: selectedStyle,
        fit: selectedFit,
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
      
      {/* Style Selector */}
      <div className="option-group">
        <h3 className="option-title">Choose Style</h3>
        <div className="style-grid">
          {superProduct.options.style.values.map(style => (
            <div 
              key={style.id}
              className={`style-option ${selectedStyle?.id === style.id ? 'selected' : ''}`}
              onClick={() => setSelectedStyle(style)}
            >
              <div className="style-mockup">
                <MockupPreview 
                  garmentType={style.id}
                  color={selectedColor || style.colors[0]}
                  designImage={superProduct.designImage}
                  width={120}
                  height={160}
                />
              </div>
              <div className="style-info">
                <span className="style-name">{style.name}</span>
                <span className="style-price">${style.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fit Selector (if applicable) */}
      {selectedStyle?.fits && selectedStyle.fits.length > 1 && (
        <div className="option-group">
          <h3 className="option-title">Fit</h3>
          <div className="fit-buttons">
            {selectedStyle.fits.map(fit => (
              <button
                key={fit}
                className={`option-button fit-button ${selectedFit === fit ? 'selected' : ''}`}
                onClick={() => setSelectedFit(fit)}
              >
                {fit}
              </button>
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
                  <MockupPreview
                    garmentType={selectedStyle.id}
                    color={color}
                    designImage={superProduct.designImage}
                    width={80}
                    height={100}
                  />
                </div>
                <span className="color-name">{color}</span>
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
          disabled={isAddingToCart || !selectedStyle || !selectedColor || !selectedSize}
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
        {selectedStyle && selectedColor && selectedSize && (
          <div className="selection-summary">
            <span>
              {selectedStyle.name} • {selectedColor} • {selectedSize}
              {selectedFit && ` • ${selectedFit}`}
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

  return (
    <div className="super-product-image">
      <MockupPreview
        garmentType={selectedStyle.id}
        color={selectedColor}
        designImage={superProduct.designImage}
        width={400}
        height={500}
        className="main-mockup"
      />
    </div>
  );
}

export default SuperProductOptions;
export { SuperProductImage };