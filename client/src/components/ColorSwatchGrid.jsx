import React from 'react';

const COLOR_SWATCHES = [
  // Light colors
  { name: 'White', value: '#FFFFFF', category: 'light' },
  { name: 'Light Gray', value: '#E5E5E5', category: 'light' },
  { name: 'Ash', value: '#C0C0C0', category: 'light' },
  { name: 'Sand', value: '#F5DEB3', category: 'light' },
  { name: 'Natural', value: '#F5F5DC', category: 'light' },
  { name: 'Light Blue', value: '#ADD8E6', category: 'light' },
  { name: 'Light Pink', value: '#FFB6C1', category: 'light' },
  { name: 'Light Yellow', value: '#FFFFE0', category: 'light' },
  
  // Dark colors
  { name: 'Black', value: '#000000', category: 'dark' },
  { name: 'Charcoal', value: '#36454F', category: 'dark' },
  { name: 'Navy', value: '#000080', category: 'dark' },
  { name: 'Dark Gray', value: '#555555', category: 'dark' },
  { name: 'Forest Green', value: '#228B22', category: 'dark' },
  { name: 'Maroon', value: '#800000', category: 'dark' },
  { name: 'Dark Blue', value: '#00008B', category: 'dark' },
  { name: 'Purple', value: '#800080', category: 'dark' },
  
  // Vibrant colors
  { name: 'Red', value: '#FF0000', category: 'vibrant' },
  { name: 'Orange', value: '#FFA500', category: 'vibrant' },
  { name: 'Yellow', value: '#FFFF00', category: 'vibrant' },
  { name: 'Green', value: '#00FF00', category: 'vibrant' },
  { name: 'Blue', value: '#0000FF', category: 'vibrant' },
  { name: 'Pink', value: '#FFC0CB', category: 'vibrant' },
  { name: 'Turquoise', value: '#40E0D0', category: 'vibrant' },
  { name: 'Coral', value: '#FF7F50', category: 'vibrant' }
];

function ColorSwatchGrid({ selectedColors, onColorToggle, maxColors = 10 }) {
  const colorsByCategory = COLOR_SWATCHES.reduce((acc, color) => {
    if (!acc[color.category]) acc[color.category] = [];
    acc[color.category].push(color);
    return acc;
  }, {});

  return (
    <div className="color-swatch-grid">
      <div className="color-header">
        <h3>Select Colors</h3>
        <span className="color-count">
          {selectedColors.length} / {maxColors} selected
        </span>
      </div>
      
      {Object.entries(colorsByCategory).map(([category, colors]) => (
        <div key={category} className="color-category">
          <h4>{category.charAt(0).toUpperCase() + category.slice(1)} Colors</h4>
          <div className="swatches">
            {colors.map((color) => (
              <button
                key={color.value}
                className={`color-swatch ${selectedColors.includes(color.value) ? 'selected' : ''}`}
                onClick={() => onColorToggle(color.value)}
                disabled={!selectedColors.includes(color.value) && selectedColors.length >= maxColors}
                title={color.name}
                style={{
                  backgroundColor: color.value,
                  border: color.value === '#FFFFFF' ? '1px solid #ddd' : 'none'
                }}
              >
                {selectedColors.includes(color.value) && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7 10L9 12L13 8"
                      stroke={color.category === 'dark' ? 'white' : 'black'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
      
      <style>{`
        .color-swatch-grid {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .color-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .color-header h3 {
          margin: 0;
        }
        
        .color-count {
          color: #666;
          font-size: 14px;
        }
        
        .color-category {
          margin-bottom: 20px;
        }
        
        .color-category h4 {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .swatches {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
          gap: 8px;
        }
        
        .color-swatch {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .color-swatch:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .color-swatch.selected {
          box-shadow: 0 0 0 3px #007bff;
        }
        
        .color-swatch:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default ColorSwatchGrid;