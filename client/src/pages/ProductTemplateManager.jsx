import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ProductTemplateManager.css';

const DEFAULT_CANVAS = { width: 600, height: 600 };
const NFT_CANVAS = { width: 450, height: 600 }; // 3:4 aspect ratio for trading cards

const ProductTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [uploadStatus, setUploadStatus] = useState({});
  
  // Form state for editing/creating
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    templateId: '',
    price: 0,
    colors: [],
    canvasWidth: 600,
    canvasHeight: 600,
    frontImage: '',
    backImage: '',
    thumbnailImage: '',
    printAreas: {
      front: { width: 200, height: 250, x: 200, y: 200 },
      back: null
    },
    hasBackPrint: true,
    category: 'apparel', // apparel, accessories, art, cards
    active: true
  });

  const [newColor, setNewColor] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/api/settings/product-templates');
      if (response.data.success) {
        setTemplates(response.data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      ...template,
      colors: template.colors || [],
      canvasWidth: template.canvasWidth || DEFAULT_CANVAS.width,
      canvasHeight: template.canvasHeight || DEFAULT_CANVAS.height,
      printAreas: template.printAreas || {
        front: { width: 200, height: 250, x: 200, y: 200 },
        back: template.hasBackPrint ? { width: 200, height: 250, x: 200, y: 200 } : null
      }
    });
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedTemplate(null);
    setFormData({
      id: '',
      name: '',
      templateId: '',
      price: 0,
      colors: ['Black', 'White'],
      canvasWidth: 600,
      canvasHeight: 600,
      frontImage: '',
      backImage: '',
      thumbnailImage: '',
      printAreas: {
        front: { width: 200, height: 250, x: 200, y: 200 },
        back: { width: 200, height: 250, x: 200, y: 200 }
      },
      hasBackPrint: true,
      category: 'apparel',
      active: true
    });
  };

  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus({ ...uploadStatus, [imageType]: 'Uploading...' });

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        // Upload to Cloudinary via backend
        const response = await api.post('/api/settings/upload-template-image', {
          image: base64,
          imageType: imageType,
          templateId: formData.id || 'new-template'
        });

        if (response.data.success) {
          setFormData({
            ...formData,
            [`${imageType}Image`]: response.data.url
          });
          setUploadStatus({ ...uploadStatus, [imageType]: 'Uploaded!' });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ ...uploadStatus, [imageType]: 'Upload failed' });
    }

    setTimeout(() => {
      setUploadStatus({ ...uploadStatus, [imageType]: '' });
    }, 3000);
  };

  const addColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData({
        ...formData,
        colors: [...formData.colors, newColor]
      });
      setNewColor('');
    }
  };

  const removeColor = (color) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter(c => c !== color)
    });
  };

  const updatePrintArea = (side, field, value) => {
    const numValue = parseInt(value) || 0;
    setFormData({
      ...formData,
      printAreas: {
        ...formData.printAreas,
        [side]: {
          ...formData.printAreas[side],
          [field]: numValue
        }
      }
    });
  };

  const saveTemplate = async () => {
    setSaveStatus('Saving...');
    
    try {
      const endpoint = isCreating 
        ? '/api/settings/product-templates/create'
        : '/api/settings/product-templates/update';
      
      const response = await api.post(endpoint, formData);
      
      if (response.data.success) {
        setSaveStatus('Saved successfully!');
        loadTemplates(); // Reload templates
        setIsEditing(false);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('Save failed');
    }

    setTimeout(() => setSaveStatus(''), 3000);
  };

  const deleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template? This affects ALL users.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/settings/product-templates/${templateId}`);
      if (response.data.success) {
        loadTemplates();
        setSelectedTemplate(null);
        setSaveStatus('Template deleted');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setSaveStatus('Delete failed');
    }
  };

  const applyPresetCanvas = (preset) => {
    switch (preset) {
      case 'square':
        setFormData({ ...formData, canvasWidth: 600, canvasHeight: 600 });
        break;
      case 'portrait':
        setFormData({ ...formData, canvasWidth: 450, canvasHeight: 600 });
        break;
      case 'landscape':
        setFormData({ ...formData, canvasWidth: 800, canvasHeight: 600 });
        break;
      case 'nft-card':
        setFormData({ ...formData, canvasWidth: 450, canvasHeight: 600 });
        break;
    }
  };

  return (
    <div className="product-template-manager">
      <h1>Product Template Manager (Admin Only)</h1>
      <div className="admin-warning">
        ⚠️ <strong>Admin Tool:</strong> Changes here affect ALL products and ALL users globally.
        Product templates define available garment types across the entire platform.
      </div>

      <div className="manager-container">
        <div className="templates-sidebar">
          <div className="sidebar-header">
            <h3>Product Templates</h3>
            <button onClick={handleCreateNew} className="btn-create">
              + New Template
            </button>
          </div>
          
          <div className="templates-list">
            <div className="category-section">
              <h4>Apparel</h4>
              {templates.filter(t => t.category === 'apparel').map(template => (
                <div
                  key={template.id}
                  className={`template-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
                  onClick={() => selectTemplate(template)}
                >
                  <span className="template-name">{template.name}</span>
                  {!template.active && <span className="inactive-badge">Inactive</span>}
                </div>
              ))}
            </div>

            <div className="category-section">
              <h4>Accessories</h4>
              {templates.filter(t => t.category === 'accessories').map(template => (
                <div
                  key={template.id}
                  className={`template-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
                  onClick={() => selectTemplate(template)}
                >
                  <span className="template-name">{template.name}</span>
                  {!template.active && <span className="inactive-badge">Inactive</span>}
                </div>
              ))}
            </div>

            <div className="category-section">
              <h4>Art & Cards</h4>
              {templates.filter(t => ['art', 'cards'].includes(t.category)).map(template => (
                <div
                  key={template.id}
                  className={`template-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
                  onClick={() => selectTemplate(template)}
                >
                  <span className="template-name">{template.name}</span>
                  {!template.active && <span className="inactive-badge">Inactive</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="template-editor">
          {(selectedTemplate || isCreating) ? (
            <>
              <div className="editor-header">
                <h2>{isCreating ? 'Create New Template' : formData.name}</h2>
                <div className="editor-actions">
                  {!isCreating && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn-edit">
                      Edit Template
                    </button>
                  )}
                  {(isEditing || isCreating) && (
                    <>
                      <button onClick={saveTemplate} className="btn-save">
                        {saveStatus || 'Save Changes'}
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditing(false);
                          setIsCreating(false);
                          if (selectedTemplate) selectTemplate(selectedTemplate);
                        }} 
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {!isCreating && (
                    <button onClick={() => deleteTemplate(formData.id)} className="btn-delete">
                      Delete Template
                    </button>
                  )}
                </div>
              </div>

              <div className="editor-content">
                <div className="form-section">
                  <h3>Basic Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Template ID (unique)</label>
                      <input
                        type="text"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        disabled={!isCreating}
                        placeholder="e.g., premium-tee"
                      />
                    </div>
                    <div className="form-group">
                      <label>Display Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing && !isCreating}
                        placeholder="e.g., Premium T-Shirt"
                      />
                    </div>
                    <div className="form-group">
                      <label>Template ID (for mockups)</label>
                      <input
                        type="text"
                        value={formData.templateId}
                        onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                        disabled={!isEditing && !isCreating}
                        placeholder="e.g., tshirt_front"
                      />
                    </div>
                    <div className="form-group">
                      <label>Base Price ($)</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        disabled={!isEditing && !isCreating}
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={!isEditing && !isCreating}
                      >
                        <option value="apparel">Apparel</option>
                        <option value="accessories">Accessories</option>
                        <option value="art">Art</option>
                        <option value="cards">Cards</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          disabled={!isEditing && !isCreating}
                        />
                        Active (visible to users)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Canvas Dimensions</h3>
                  <div className="canvas-controls">
                    <div className="form-group">
                      <label>Width (px)</label>
                      <input
                        type="number"
                        value={formData.canvasWidth}
                        onChange={(e) => setFormData({ ...formData, canvasWidth: parseInt(e.target.value) })}
                        disabled={!isEditing && !isCreating}
                      />
                    </div>
                    <div className="form-group">
                      <label>Height (px)</label>
                      <input
                        type="number"
                        value={formData.canvasHeight}
                        onChange={(e) => setFormData({ ...formData, canvasHeight: parseInt(e.target.value) })}
                        disabled={!isEditing && !isCreating}
                      />
                    </div>
                    <div className="aspect-ratio">
                      Aspect Ratio: {(formData.canvasWidth / formData.canvasHeight).toFixed(2)}
                    </div>
                  </div>
                  {(isEditing || isCreating) && (
                    <div className="preset-buttons">
                      <button onClick={() => applyPresetCanvas('square')}>Square (1:1)</button>
                      <button onClick={() => applyPresetCanvas('portrait')}>Portrait (3:4)</button>
                      <button onClick={() => applyPresetCanvas('landscape')}>Landscape (4:3)</button>
                      <button onClick={() => applyPresetCanvas('nft-card')}>NFT Card (3:4)</button>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3>Garment Images</h3>
                  <div className="image-uploads">
                    <div className="image-upload-group">
                      <label>Front Image</label>
                      {formData.frontImage && (
                        <img src={formData.frontImage} alt="Front" className="preview-image" />
                      )}
                      {(isEditing || isCreating) && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'front')}
                            id="front-upload"
                          />
                          <label htmlFor="front-upload" className="upload-btn">
                            {uploadStatus.front || 'Upload Front Image'}
                          </label>
                        </>
                      )}
                    </div>

                    {formData.hasBackPrint && (
                      <div className="image-upload-group">
                        <label>Back Image</label>
                        {formData.backImage && (
                          <img src={formData.backImage} alt="Back" className="preview-image" />
                        )}
                        {(isEditing || isCreating) && (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'back')}
                              id="back-upload"
                            />
                            <label htmlFor="back-upload" className="upload-btn">
                              {uploadStatus.back || 'Upload Back Image'}
                            </label>
                          </>
                        )}
                      </div>
                    )}

                    <div className="image-upload-group">
                      <label>Thumbnail</label>
                      {formData.thumbnailImage && (
                        <img src={formData.thumbnailImage} alt="Thumbnail" className="preview-image" />
                      )}
                      {(isEditing || isCreating) && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'thumbnail')}
                            id="thumb-upload"
                          />
                          <label htmlFor="thumb-upload" className="upload-btn">
                            {uploadStatus.thumbnail || 'Upload Thumbnail'}
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Available Colors</h3>
                  <div className="colors-manager">
                    <div className="color-list">
                      {formData.colors.map(color => (
                        <div key={color} className="color-chip">
                          <span>{color}</span>
                          {(isEditing || isCreating) && (
                            <button onClick={() => removeColor(color)} className="remove-btn">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                    {(isEditing || isCreating) && (
                      <div className="add-color">
                        <input
                          type="text"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder="Add color name"
                        />
                        <button onClick={addColor}>Add Color</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <h3>Print Areas (Bounding Boxes)</h3>
                  <div className="print-areas">
                    <div className="print-area-group">
                      <h4>Front Print Area</h4>
                      <div className="coordinate-grid">
                        <div className="coord-input">
                          <label>X</label>
                          <input
                            type="number"
                            value={formData.printAreas.front.x}
                            onChange={(e) => updatePrintArea('front', 'x', e.target.value)}
                            disabled={!isEditing && !isCreating}
                          />
                        </div>
                        <div className="coord-input">
                          <label>Y</label>
                          <input
                            type="number"
                            value={formData.printAreas.front.y}
                            onChange={(e) => updatePrintArea('front', 'y', e.target.value)}
                            disabled={!isEditing && !isCreating}
                          />
                        </div>
                        <div className="coord-input">
                          <label>Width</label>
                          <input
                            type="number"
                            value={formData.printAreas.front.width}
                            onChange={(e) => updatePrintArea('front', 'width', e.target.value)}
                            disabled={!isEditing && !isCreating}
                          />
                        </div>
                        <div className="coord-input">
                          <label>Height</label>
                          <input
                            type="number"
                            value={formData.printAreas.front.height}
                            onChange={(e) => updatePrintArea('front', 'height', e.target.value)}
                            disabled={!isEditing && !isCreating}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="print-area-group">
                      <h4>
                        <input
                          type="checkbox"
                          checked={formData.hasBackPrint}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            hasBackPrint: e.target.checked,
                            printAreas: {
                              ...formData.printAreas,
                              back: e.target.checked ? { width: 200, height: 250, x: 200, y: 200 } : null
                            }
                          })}
                          disabled={!isEditing && !isCreating}
                        />
                        Has Back Print
                      </h4>
                      {formData.hasBackPrint && formData.printAreas.back && (
                        <div className="coordinate-grid">
                          <div className="coord-input">
                            <label>X</label>
                            <input
                              type="number"
                              value={formData.printAreas.back.x}
                              onChange={(e) => updatePrintArea('back', 'x', e.target.value)}
                              disabled={!isEditing && !isCreating}
                            />
                          </div>
                          <div className="coord-input">
                            <label>Y</label>
                            <input
                              type="number"
                              value={formData.printAreas.back.y}
                              onChange={(e) => updatePrintArea('back', 'y', e.target.value)}
                              disabled={!isEditing && !isCreating}
                            />
                          </div>
                          <div className="coord-input">
                            <label>Width</label>
                            <input
                              type="number"
                              value={formData.printAreas.back.width}
                              onChange={(e) => updatePrintArea('back', 'width', e.target.value)}
                              disabled={!isEditing && !isCreating}
                            />
                          </div>
                          <div className="coord-input">
                            <label>Height</label>
                            <input
                              type="number"
                              value={formData.printAreas.back.height}
                              onChange={(e) => updatePrintArea('back', 'height', e.target.value)}
                              disabled={!isEditing && !isCreating}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a template from the sidebar or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductTemplateManager;