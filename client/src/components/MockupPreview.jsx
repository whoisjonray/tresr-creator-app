import React, { useState, useEffect } from 'react';
import './MockupPreview.css';
import { 
  GARMENT_IMAGES as CLOUDINARY_IMAGES, 
  getGarmentImage as getCloudinaryImage,
  getAvailableColors
} from '../config/garmentImagesCloudinary';
import { 
  GARMENT_FALLBACKS, 
  DESIGN_POSITIONS as IMPORTED_DESIGN_POSITIONS
} from '../config/garmentImages';

// Use imported garment configurations
const GARMENT_BASES = GARMENT_FALLBACKS;

// CSS filters as fallback for colors we don't have pre-rendered images for
const COLOR_FILTERS = {
  'Maroon': 'hue-rotate(340deg) saturate(1.4) brightness(0.3)',
  'Light Blue': 'hue-rotate(200deg) saturate(0.8) brightness(0.9)',
  'Olive': 'hue-rotate(80deg) saturate(1.2) brightness(0.5)',
  'Brown': 'hue-rotate(20deg) saturate(1.3) brightness(0.35)',
  'Tan': 'hue-rotate(40deg) saturate(0.6) brightness(0.8)',
  'Gold': 'hue-rotate(50deg) saturate(2.0) brightness(0.85)',
  'Charcoal': 'brightness(0.25) contrast(1.1)',
  'Kelly Green': 'hue-rotate(140deg) saturate(1.8) brightness(0.5)',
  'Turquoise': 'hue-rotate(180deg) saturate(1.4) brightness(0.6)'
};

// Use imported design positions
const DESIGN_POSITIONS = IMPORTED_DESIGN_POSITIONS;

function MockupPreview({ 
  garmentType, 
  color, 
  designImage, 
  designPosition, 
  className = '',
  showColorName = false,
  width = 300,
  height = 400 
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [baseImageError, setBaseImageError] = useState(false);

  // Try to get pre-rendered image from Cloudinary first
  const cloudinaryImage = getCloudinaryImage(garmentType, color);
  const hasPreRenderedImage = cloudinaryImage !== null;
  
  // Fall back to base image with CSS filter if no pre-rendered image
  const garmentImage = hasPreRenderedImage ? cloudinaryImage : GARMENT_BASES[garmentType];
  
  // Only use CSS filter if we don't have a pre-rendered image for this color
  const needsColorFilter = !hasPreRenderedImage && COLOR_FILTERS[color];
  const colorFilter = needsColorFilter ? COLOR_FILTERS[color] : 'none';
  const position = designPosition || DESIGN_POSITIONS[garmentType] || DESIGN_POSITIONS['classic-tee'];

  // Generate fallback placeholder if base image fails
  const generateFallbackImage = () => {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="15%" y="25%" width="70%" height="50%" fill="#e5e7eb" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#6b7280" 
              font-family="Arial" font-size="14" dy=".3em">
          ${garmentType.replace('-', ' ').toUpperCase()}
        </text>
        <text x="50%" y="65%" text-anchor="middle" fill="#9ca3af" 
              font-family="Arial" font-size="12" dy=".3em">
          ${color}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  useEffect(() => {
    setImageLoaded(false);
    setBaseImageError(false);
  }, [garmentType, color]);

  return (
    <div 
      className={`mockup-preview ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Garment image - either pre-rendered or base with CSS filter */}
      <div className="garment-container">
        {!baseImageError ? (
          <img
            src={garmentImage}
            alt={`${garmentType} in ${color}`}
            className="garment-base"
            style={{ 
              filter: colorFilter,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setBaseImageError(true)}
          />
        ) : (
          <img
            src={generateFallbackImage()}
            alt={`${garmentType} placeholder`}
            className="garment-fallback"
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>

      {/* Design overlay */}
      {designImage && imageLoaded && (
        <img
          src={designImage}
          alt="Design overlay"
          className="design-overlay"
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            transform: `translate(-50%, -50%) scale(${position.scale}) ${position.transform || ''}`,
            maxWidth: position.maxWidth,
            maxHeight: position.maxWidth,
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Optional color name label */}
      {showColorName && (
        <div className="color-label">
          {color}
        </div>
      )}

      {/* Loading indicator */}
      {!imageLoaded && !baseImageError && (
        <div className="mockup-loading">
          <div className="loading-spinner"></div>
          <span>Loading mockup...</span>
        </div>
      )}
    </div>
  );
}

// Component for showing multiple color variations
function MockupColorGrid({ garmentType, designImage, colors, onColorSelect }) {
  return (
    <div className="mockup-color-grid">
      {colors.map(color => (
        <div 
          key={color} 
          className="mockup-color-option"
          onClick={() => onColorSelect && onColorSelect(color)}
        >
          <MockupPreview
            garmentType={garmentType}
            color={color}
            designImage={designImage}
            width={120}
            height={160}
            showColorName={true}
          />
        </div>
      ))}
    </div>
  );
}

// Component for comparing API vs CSS mockups
function MockupComparison({ garmentType, color, designImage }) {
  const [apiMockup, setApiMockup] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const generateApiMockup = async () => {
    setApiLoading(true);
    try {
      // This would call the Dynamic Mockups API
      const response = await fetch('/api/mockups/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designUrl: designImage,
          templateId: garmentType,
          color: color
        })
      });
      const data = await response.json();
      setApiMockup(data.mockup?.url);
    } catch (error) {
      console.error('API mockup failed:', error);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="mockup-comparison">
      <div className="comparison-side">
        <h3>Pre-Rendered Mockup (Instant - $0)</h3>
        <MockupPreview
          garmentType={garmentType}
          color={color}
          designImage={designImage}
        />
        <div className="mockup-stats">
          <div className="stat-item">
            <span className="stat-label">Generation Time:</span>
            <span className="stat-value instant">0ms</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Cost:</span>
            <span className="stat-value free">$0.00</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Quality:</span>
            <span className="stat-value perfect">Professional Photos</span>
          </div>
        </div>
      </div>

      <div className="comparison-side">
        <h3>API Mockup ($0.10-0.50)</h3>
        <div className="api-mockup-container">
          {apiMockup ? (
            <img src={apiMockup} alt="API generated mockup" />
          ) : (
            <div className="api-placeholder">
              <button onClick={generateApiMockup} disabled={apiLoading}>
                {apiLoading ? 'Generating...' : 'Generate API Mockup'}
              </button>
            </div>
          )}
        </div>
        <div className="mockup-stats">
          <div className="stat-item">
            <span className="stat-label">Generation Time:</span>
            <span className="stat-value slow">1-3s</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Cost:</span>
            <span className="stat-value expensive">$0.10-0.50</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MockupPreview;
export { MockupColorGrid, MockupComparison };