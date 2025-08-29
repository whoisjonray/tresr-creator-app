import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './MockupReview.css';

function MockupReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mockups, setMockups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedMockups, setSelectedMockups] = useState([]);
  const [designData, setDesignData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get mockup data from navigation state
    if (location.state?.mockups && location.state?.designData) {
      setMockups(location.state.mockups);
      setDesignData(location.state.designData);
      // Select all mockups by default
      setSelectedMockups(location.state.mockups.map((_, index) => index));
    } else {
      // No data passed, redirect back to design editor
      setError('No mockup data found. Please generate mockups first.');
      setTimeout(() => navigate('/design/new'), 3000);
    }
  }, [location, navigate]);

  // Handle editing a specific mockup
  const handleEditMockup = (mockupIndex) => {
    const mockup = mockups[mockupIndex];
    // Navigate back to design editor with specific variant data
    navigate('/design/new', {
      state: {
        editMode: 'variant',
        variantData: mockup,
        originalMockups: mockups,
        designData: designData,
        returnTo: '/mockup-review'
      }
    });
  };

  // Handle regenerating all mockups
  const handleRegenerateAll = () => {
    navigate('/design/new', {
      state: {
        ...designData,
        regenerate: true
      }
    });
  };

  // Toggle mockup selection
  const toggleMockupSelection = (index) => {
    setSelectedMockups(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedMockups.length === mockups.length) {
      setSelectedMockups([]);
    } else {
      setSelectedMockups(mockups.map((_, index) => index));
    }
  };

  // Handle save for later
  const handleSaveForLater = async () => {
    try {
      setLoading(true);
      
      // Save design and mockups to backend
      const response = await api.post('/api/designs/save', {
        designData,
        mockups: mockups.filter((_, index) => selectedMockups.includes(index)),
        status: 'draft'
      });

      if (response.data.success) {
        alert('Design saved successfully!');
        navigate('/products');
      }
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle publish to Shopify
  const handlePublish = async () => {
    if (selectedMockups.length === 0) {
      alert('Please select at least one mockup to publish');
      return;
    }

    try {
      setPublishing(true);
      
      // Get selected mockup data
      const selectedMockupData = mockups.filter((_, index) => selectedMockups.includes(index));
      
      // Create SuperProduct in Shopify
      const response = await api.post('/api/products/create-superproduct', {
        title: designData.title,
        description: designData.description || `Created with ${designData.title} design`,
        vendor: designData.vendor || 'TRESR',
        mockups: selectedMockupData,
        designData: {
          frontImage: designData.frontImage,
          backImage: designData.backImage,
          position: designData.position,
          scale: designData.scale
        }
      });

      if (response.data.success) {
        alert('SuperProduct published successfully to Shopify!');
        navigate('/products');
      } else {
        throw new Error(response.data.error || 'Failed to publish');
      }
    } catch (error) {
      console.error('Error publishing to Shopify:', error);
      alert(`Failed to publish: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  if (error) {
    return (
      <div className="mockup-review-error">
        <h2>Error</h2>
        <p>{error}</p>
        <p>Redirecting to design editor...</p>
      </div>
    );
  }

  return (
    <div className="mockup-review-page">
      {/* Header */}
      <div className="review-header">
        <div className="header-left">
          <button onClick={() => navigate('/design/new')} className="btn-back">
            ← Back to Editor
          </button>
          <h1>Review Mockups</h1>
        </div>
        <div className="header-right">
          <button onClick={handleRegenerateAll} className="btn-regenerate">
            🔄 Regenerate All
          </button>
          <button onClick={toggleSelectAll} className="btn-select-all">
            {selectedMockups.length === mockups.length ? '☐ Deselect All' : '☑ Select All'}
          </button>
        </div>
      </div>

      {/* Design Info */}
      {designData && (
        <div className="design-info">
          <h2>{designData.title}</h2>
          <p>{mockups.length} variants generated</p>
          <p>{selectedMockups.length} selected for publishing</p>
        </div>
      )}

      {/* Mockup Grid */}
      <div className="mockup-grid">
        {mockups.map((mockup, index) => (
          <div 
            key={index} 
            className={`mockup-card ${selectedMockups.includes(index) ? 'selected' : ''}`}
          >
            {/* Selection checkbox */}
            <div className="mockup-selection">
              <input
                type="checkbox"
                checked={selectedMockups.includes(index)}
                onChange={() => toggleMockupSelection(index)}
                id={`mockup-${index}`}
              />
              <label htmlFor={`mockup-${index}`}>
                {selectedMockups.includes(index) ? '✓' : ''}
              </label>
            </div>

            {/* Mockup image */}
            <div className="mockup-image-container">
              <img 
                src={mockup.imageUrl || mockup.mockupUrl} 
                alt={`${mockup.productName} - ${mockup.color}`}
                className="mockup-image"
              />
              {mockup.status === 'error' && (
                <div className="mockup-error-overlay">
                  <span>⚠️ Generation Failed</span>
                </div>
              )}
            </div>

            {/* Mockup details */}
            <div className="mockup-details">
              <h3>{mockup.productName}</h3>
              <p className="mockup-color">{mockup.color}</p>
              <p className="mockup-style">{mockup.style || 'Standard'}</p>
              {mockup.price && (
                <p className="mockup-price">${mockup.price}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="mockup-actions">
              <button 
                onClick={() => handleEditMockup(index)}
                className="btn-edit"
                title="Edit positioning for this variant"
              >
                ✏️ Edit
              </button>
              {mockup.status === 'error' && (
                <button 
                  onClick={() => handleEditMockup(index)}
                  className="btn-retry"
                >
                  🔄 Retry
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="review-actions">
        <button 
          onClick={handleSaveForLater}
          className="btn-save"
          disabled={loading || publishing}
        >
          {loading ? 'Saving...' : '💾 Save for Later'}
        </button>
        <button 
          onClick={handlePublish}
          className="btn-publish"
          disabled={publishing || selectedMockups.length === 0}
        >
          {publishing ? 'Publishing...' : `🚀 Publish ${selectedMockups.length} Variants to Shopify`}
        </button>
      </div>

      {/* Publishing progress */}
      {publishing && (
        <div className="publishing-overlay">
          <div className="publishing-modal">
            <h2>Publishing to Shopify...</h2>
            <div className="spinner"></div>
            <p>Creating SuperProduct with {selectedMockups.length} variants</p>
            <p className="publishing-note">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MockupReview;