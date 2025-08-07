import React, { useState, useEffect } from 'react';
import canvasImageGenerator from '../services/canvasImageGenerator';
import { getGarmentImage } from '../config/garmentImagesCloudinary';
import './CanvasTestPage.css';

const GARMENT_TYPES = [
  { id: 'tee', name: 'Medium Weight T-Shirt', colors: ['Black', 'White', 'Navy', 'Natural', 'Dark Grey', 'Cardinal Red'] },
  { id: 'boxy', name: 'Oversized Drop Shoulder', colors: ['Black', 'Natural'] },
  { id: 'next-crop', name: 'Next Level Crop Top', colors: ['Black', 'White', 'Pink', 'Navy'] },
  { id: 'wmn-hoodie', name: "Women's Independent Hoodie", colors: ['Black', 'Pink', 'Natural', 'White'] },
  { id: 'med-hood', name: 'Medium Weight Hoodie', colors: ['Black', 'White', 'Navy', 'Mint'] },
  { id: 'mediu', name: 'Medium Weight Sweatshirt', colors: ['Black', 'White', 'Navy', 'Light Grey'] },
  { id: 'polo', name: 'Standard Polo', colors: ['Black', 'White', 'Navy'] },
];

const JUST_GROK_IT_FRONT = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png';

const CanvasTestPage = () => {
  const [generatedImages, setGeneratedImages] = useState({});
  const [loading, setLoading] = useState({});
  const [selectedGarment, setSelectedGarment] = useState('tee');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [scale, setScale] = useState(0.3);
  const [position, setPosition] = useState({ x: 500, y: 400 });

  const generateImage = async (garmentId, color) => {
    const key = `${garmentId}-${color}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      console.log(`🎨 Generating Canvas image for ${garmentId} in ${color}...`);
      
      // Map garment ID to template ID
      const templateMap = {
        'tee': 'tshirt_front',
        'boxy': 'tshirt_boxy_front',
        'next-crop': 'croptop_front',
        'wmn-hoodie': 'hoodie_front',
        'med-hood': 'hoodie_front',
        'mediu': 'crewneck_front',
        'polo': 'polo_front'
      };

      const templateId = templateMap[garmentId] || 'tshirt_front';
      
      const result = await canvasImageGenerator.generateProductImage(
        JUST_GROK_IT_FRONT,
        templateId,
        color,
        position,
        scale
      );

      setGeneratedImages(prev => ({
        ...prev,
        [key]: result
      }));

      console.log(`✅ Canvas generation complete for ${garmentId} in ${color}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${garmentId} in ${color}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const generateAllForGarment = async (garmentId) => {
    const garment = GARMENT_TYPES.find(g => g.id === garmentId);
    if (!garment) return;

    console.log(`🚀 Generating all colors for ${garment.name}...`);
    
    for (const color of garment.colors) {
      await generateImage(garmentId, color);
      // Small delay between generations to prevent overload
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const generateAll = async () => {
    console.log('🎯 Generating all garments in all colors...');
    
    for (const garment of GARMENT_TYPES) {
      await generateAllForGarment(garment.id);
    }
  };

  const currentGarment = GARMENT_TYPES.find(g => g.id === selectedGarment);
  const imageKey = `${selectedGarment}-${selectedColor}`;
  const currentImage = generatedImages[imageKey];

  return (
    <div className="canvas-test-page">
      <h1>Canvas Generation Test - JUST Grok IT</h1>
      
      <div className="test-controls">
        <div className="control-group">
          <label>Design Scale: {scale.toFixed(2)}</label>
          <input 
            type="range" 
            min="0.1" 
            max="1.0" 
            step="0.05" 
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Position X: {position.x}</label>
          <input 
            type="range" 
            min="200" 
            max="800" 
            step="10" 
            value={position.x}
            onChange={(e) => setPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
          />
        </div>

        <div className="control-group">
          <label>Position Y: {position.y}</label>
          <input 
            type="range" 
            min="200" 
            max="800" 
            step="10" 
            value={position.y}
            onChange={(e) => setPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
          />
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => generateImage(selectedGarment, selectedColor)}
            disabled={loading[imageKey]}
            className="btn-primary"
          >
            {loading[imageKey] ? 'Generating...' : 'Generate Current'}
          </button>
          
          <button 
            onClick={() => generateAllForGarment(selectedGarment)}
            className="btn-secondary"
          >
            Generate All {currentGarment?.name} Colors
          </button>
          
          <button 
            onClick={generateAll}
            className="btn-success"
          >
            Generate All Garments (All Colors)
          </button>
        </div>
      </div>

      <div className="garment-selector">
        <h3>Select Garment Type</h3>
        <div className="garment-tabs">
          {GARMENT_TYPES.map(garment => (
            <button
              key={garment.id}
              onClick={() => setSelectedGarment(garment.id)}
              className={selectedGarment === garment.id ? 'active' : ''}
            >
              {garment.name}
            </button>
          ))}
        </div>
      </div>

      {currentGarment && (
        <div className="color-selector">
          <h3>Select Color</h3>
          <div className="color-swatches">
            {currentGarment.colors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                style={{
                  backgroundColor: color === 'Natural' ? '#FEF3C7' : 
                                  color === 'Dark Grey' ? '#4A4A4A' :
                                  color === 'Light Grey' ? '#9CA3AF' :
                                  color === 'Cardinal Red' ? '#EC5039' :
                                  color === 'Navy' ? '#080F20' :
                                  color === 'Pink' ? '#F82F57' :
                                  color === 'Mint' ? '#98FF98' :
                                  color.toLowerCase()
                }}
                title={color}
              >
                {selectedColor === color && '✓'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="preview-section">
        <h3>Generated Canvas Image</h3>
        {currentImage ? (
          <div className="image-preview">
            <img src={currentImage.url} alt={`${selectedGarment} in ${selectedColor}`} />
            <div className="image-info">
              <p>Garment: {currentGarment?.name}</p>
              <p>Color: {selectedColor}</p>
              <p>Size: {currentImage.width}x{currentImage.height}px</p>
              <p>File Size: ~{currentImage.imageSizeKB}KB</p>
              <p>Scale: {scale.toFixed(2)}</p>
              <p>Position: ({position.x}, {position.y})</p>
            </div>
          </div>
        ) : (
          <div className="empty-preview">
            <p>Click "Generate Current" to create a Canvas image</p>
          </div>
        )}
      </div>

      <div className="generated-gallery">
        <h3>All Generated Images</h3>
        <div className="gallery-grid">
          {Object.entries(generatedImages).map(([key, image]) => {
            const [garmentId, ...colorParts] = key.split('-');
            const color = colorParts.join('-');
            const garment = GARMENT_TYPES.find(g => g.id === garmentId);
            
            return (
              <div key={key} className="gallery-item">
                <img src={image.url} alt={`${garmentId} in ${color}`} />
                <div className="gallery-item-info">
                  <strong>{garment?.name}</strong>
                  <span>{color}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CanvasTestPage;