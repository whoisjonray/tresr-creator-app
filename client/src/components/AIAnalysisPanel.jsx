import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AIAnalysisPanel.css';

const AIAnalysisPanel = ({ uploadedImage, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [usage, setUsage] = useState(null);
  const [options, setOptions] = useState({
    includeMetaDescription: true,
    includeSeoDescription: true,
    includeTagSuggestions: true,
    includeColorAnalysis: true,
    targetAudience: 'general',
    designType: 'graphic'
  });

  useEffect(() => {
    checkAIStatus();
    loadUsage();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await api.get('/api/ai/status');
      setAiStatus(response.data);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiStatus({ available: false });
    }
  };

  const loadUsage = async () => {
    try {
      const response = await api.get('/api/ai/usage');
      if (response.data.success) {
        setUsage(response.data.usage);
      }
    } catch (error) {
      // Usage endpoint requires auth, ignore errors for guest users
      console.log('Usage data not available (guest user)');
    }
  };

  const analyzeImage = async () => {
    if (!uploadedImage || !aiStatus?.available) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      let response;

      if (typeof uploadedImage === 'string' && uploadedImage.startsWith('http')) {
        // Analyze from URL
        response = await api.post('/api/ai/analyze-url', {
          imageUrl: uploadedImage,
          ...options
        });
      } else {
        // Analyze uploaded file
        const formData = new FormData();
        
        if (uploadedImage instanceof File) {
          formData.append('image', uploadedImage);
        } else {
          // Convert data URL to blob
          const response = await fetch(uploadedImage);
          const blob = await response.blob();
          formData.append('image', blob, 'design.png');
        }

        // Add options to form data
        Object.entries(options).forEach(([key, value]) => {
          formData.append(key, value.toString());
        });

        response = await api.post('/api/ai/analyze-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (response.data.success) {
        setAnalysisResult(response.data);
        onAnalysisComplete?.(response.data);
        loadUsage(); // Refresh usage stats
      } else {
        setError(response.data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      
      if (error.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 503) {
        setError('AI service temporarily unavailable');
      } else {
        setError(error.response?.data?.error || 'Analysis failed');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAlternatives = async (variant) => {
    if (!analysisResult?.analysis) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await api.post('/api/ai/generate-alternatives', {
        existingData: {
          metaDescription: analysisResult.analysis.meta_description,
          tags: analysisResult.analysis.tags,
          designStyle: analysisResult.analysis.design_style
        },
        variant: variant
      });

      if (response.data.success) {
        // Update analysis result with alternatives
        setAnalysisResult(prev => ({
          ...prev,
          alternatives: {
            ...prev.alternatives,
            [variant]: response.data.alternatives
          }
        }));
        loadUsage();
      } else {
        setError(response.data.error || 'Failed to generate alternatives');
      }
    } catch (error) {
      console.error('Alternative generation error:', error);
      setError(error.response?.data?.error || 'Failed to generate alternatives');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show success feedback
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    });
  };

  if (!aiStatus) {
    return <div className="ai-analysis-panel loading">Loading AI features...</div>;
  }

  if (!aiStatus.available) {
    return (
      <div className="ai-analysis-panel unavailable">
        <h3>AI Analysis Unavailable</h3>
        <p>AI-powered content generation is not configured.</p>
        <small>Contact administrator to enable OpenAI integration.</small>
      </div>
    );
  }

  return (
    <div className="ai-analysis-panel">
      <div className="ai-header">
        <h3>AI Design Analysis</h3>
        {usage && (
          <div className="usage-indicator">
            <span className="usage-count">{usage.remaining}/{usage.limit}</span>
            <span className="usage-label">requests left</span>
          </div>
        )}
      </div>

      {/* Analysis Options */}
      <div className="analysis-options">
        <h4>Analysis Options</h4>
        <div className="option-grid">
          <label>
            <input
              type="checkbox"
              checked={options.includeMetaDescription}
              onChange={(e) => setOptions(prev => ({ ...prev, includeMetaDescription: e.target.checked }))}
            />
            Meta Description (159 chars)
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={options.includeSeoDescription}
              onChange={(e) => setOptions(prev => ({ ...prev, includeSeoDescription: e.target.checked }))}
            />
            SEO Product Description
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={options.includeTagSuggestions}
              onChange={(e) => setOptions(prev => ({ ...prev, includeTagSuggestions: e.target.checked }))}
            />
            Search Tags
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={options.includeColorAnalysis}
              onChange={(e) => setOptions(prev => ({ ...prev, includeColorAnalysis: e.target.checked }))}
            />
            Color Analysis
          </label>
        </div>

        <div className="advanced-options">
          <select 
            value={options.targetAudience}
            onChange={(e) => setOptions(prev => ({ ...prev, targetAudience: e.target.value }))}
          >
            <option value="general">General Audience</option>
            <option value="youth">Young Adults</option>
            <option value="professional">Professional</option>
            <option value="creative">Creative Community</option>
            <option value="gaming">Gaming Community</option>
          </select>

          <select 
            value={options.designType}
            onChange={(e) => setOptions(prev => ({ ...prev, designType: e.target.value }))}
          >
            <option value="graphic">Graphic Design</option>
            <option value="text">Text-Based</option>
            <option value="illustration">Illustration</option>
            <option value="photo">Photography</option>
            <option value="abstract">Abstract Art</option>
          </select>
        </div>
      </div>

      {/* Analyze Button */}
      <button 
        className="analyze-button"
        onClick={analyzeImage}
        disabled={!uploadedImage || isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <div className="spinner"></div>
            Analyzing...
          </>
        ) : (
          'Analyze Design with AI'
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="analysis-results">
          <h4>Analysis Results</h4>
          
          {analysisResult.analysis.meta_description && (
            <div className="result-section">
              <label>Meta Description ({analysisResult.analysis.meta_description.length}/159)</label>
              <div className="result-content">
                <textarea 
                  value={analysisResult.analysis.meta_description}
                  onChange={(e) => setAnalysisResult(prev => ({
                    ...prev,
                    analysis: { ...prev.analysis, meta_description: e.target.value }
                  }))}
                  rows={2}
                />
                <button onClick={() => copyToClipboard(analysisResult.analysis.meta_description)}>
                  Copy
                </button>
              </div>
            </div>
          )}

          {analysisResult.analysis.seo_description && (
            <div className="result-section">
              <label>SEO Product Description</label>
              <div className="result-content">
                <textarea 
                  value={analysisResult.analysis.seo_description}
                  onChange={(e) => setAnalysisResult(prev => ({
                    ...prev,
                    analysis: { ...prev.analysis, seo_description: e.target.value }
                  }))}
                  rows={8}
                />
                <button onClick={() => copyToClipboard(analysisResult.analysis.seo_description)}>
                  Copy HTML
                </button>
              </div>
            </div>
          )}

          {analysisResult.analysis.tags && analysisResult.analysis.tags.length > 0 && (
            <div className="result-section">
              <label>Suggested Tags</label>
              <div className="tag-list">
                {analysisResult.analysis.tags.map((tag, index) => (
                  <span key={index} className="tag-pill">{tag}</span>
                ))}
              </div>
              <button onClick={() => copyToClipboard(analysisResult.analysis.tags.join(', '))}>
                Copy Tags
              </button>
            </div>
          )}

          {analysisResult.analysis.color_analysis && (
            <div className="result-section">
              <label>Color Analysis</label>
              <div className="color-analysis">
                {analysisResult.analysis.color_analysis.dominant_colors && (
                  <div className="color-info">
                    <strong>Dominant Colors:</strong> 
                    {analysisResult.analysis.color_analysis.dominant_colors.join(', ')}
                  </div>
                )}
                {analysisResult.analysis.color_analysis.recommended_apparel && (
                  <div className="color-info">
                    <strong>Recommended Apparel Colors:</strong> 
                    {analysisResult.analysis.color_analysis.recommended_apparel.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {analysisResult.analysis.target_audience && (
            <div className="result-section">
              <label>Target Audience</label>
              <p className="audience-description">{analysisResult.analysis.target_audience}</p>
            </div>
          )}

          {analysisResult.analysis.design_style && (
            <div className="result-section">
              <label>Design Style</label>
              <p className="style-description">{analysisResult.analysis.design_style}</p>
            </div>
          )}

          {/* Alternative Generation */}
          <div className="alternatives-section">
            <h5>Generate Alternative Copy</h5>
            <div className="variant-buttons">
              {['casual', 'professional', 'edgy', 'minimal'].map(variant => (
                <button 
                  key={variant}
                  onClick={() => generateAlternatives(variant)}
                  disabled={isAnalyzing}
                  className={`variant-btn ${variant}`}
                >
                  {variant}
                </button>
              ))}
            </div>

            {analysisResult.alternatives && (
              <div className="alternatives-display">
                {Object.entries(analysisResult.alternatives).map(([variant, data]) => (
                  <div key={variant} className="alternative-result">
                    <h6>{variant} variant:</h6>
                    <p><strong>Meta:</strong> {data.meta_description}</p>
                    <p><strong>Tags:</strong> {data.tags?.join(', ')}</p>
                    <p><strong>Tagline:</strong> {data.tagline}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usage Info */}
          <div className="usage-info">
            <small>
              Analysis used {analysisResult.metadata.tokens_used} tokens • 
              Model: {analysisResult.metadata.model} • 
              Cost: ~$0.001-0.003 per analysis
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;