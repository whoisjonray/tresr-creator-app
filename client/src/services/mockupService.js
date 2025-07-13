// Service for handling mockup generation with real canvas-based image generation
import canvasImageGenerator from './canvasImageGenerator';
const getApiBaseURL = () => {
  const currentHost = window.location.hostname;
  
  // If running on ngrok or localhost, use same origin
  if (currentHost.includes('ngrok') || currentHost === 'localhost') {
    return window.location.origin + '/api';
  }
  
  // If on production domain, use production API
  if (currentHost === 'creators.tresr.com') {
    return 'https://creators.tresr.com/api';
  }
  
  // Fallback to local development
  return 'http://localhost:3002/api';
};

const API_BASE_URL = getApiBaseURL();

class MockupService {
  constructor() {
    this.mockupCache = new Map();
  }

  // Upload design image and get URL
  async uploadDesign(imageDataUrl) {
    try {
      const response = await fetch(`${API_BASE_URL}/mockups/upload-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify({
          image: imageDataUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload design');
      }

      const data = await response.json();
      return data.designUrl;
    } catch (error) {
      console.error('Upload design error:', error);
      throw error;
    }
  }

  // Generate preview for a single product using real canvas-based image generation
  async generatePreview(designUrl, templateId, color, designConfig) {
    console.log('🎨 MockupService.generatePreview called with real image generator:', { 
      designUrl: designUrl ? 'present' : 'missing', 
      templateId, 
      color, 
      designConfig 
    });
    
    // Validate inputs
    if (!designUrl || !templateId || !color) {
      console.warn('Missing required data for mockup generation:', {
        designUrl: !designUrl,
        templateId: !templateId,
        color: !color
      });
      
      // Return fallback using canvas generator
      return canvasImageGenerator.generateFallbackImage(templateId, color);
    }
    
    const cacheKey = `${templateId}-${color}-${JSON.stringify(designConfig)}`;
    
    // Check cache first
    if (this.mockupCache.has(cacheKey)) {
      return this.mockupCache.get(cacheKey);
    }

    try {
      // Convert designConfig to position and scale for canvas generator
      const position = designConfig?.position ? {
        x: designConfig.position.x * 400, // Convert from 0-1 to canvas coordinates
        y: designConfig.position.y * 400
      } : { x: 200, y: 200 }; // Default center position
      
      const scale = designConfig?.scale || 1.0;
      
      // Generate real composite image using canvas
      const realImage = await canvasImageGenerator.generateProductImage(
        designUrl,
        templateId,
        color,
        position,
        scale
      );
      
      // Cache the result
      this.mockupCache.set(cacheKey, realImage);
      
      console.log('✅ Real mockup generated successfully');
      return realImage;
      
    } catch (error) {
      console.error('❌ Real image generation failed, falling back to API:', error);
      
      // Fallback to API call if canvas generation fails
      try {
        const response = await fetch(`${API_BASE_URL}/mockups/preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            designUrl,
            templateId,
            color,
            designConfig
          })
        });

        if (!response.ok) {
          throw new Error(`Preview API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache the result
        this.mockupCache.set(cacheKey, data.mockup);
        
        return data.mockup;
      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
        // Return final fallback
        return canvasImageGenerator.generateFallbackImage(templateId, color);
      }
    }
  }

  // Generate all mockups for enabled products
  async generateAllMockups(designUrl, products, designConfigs) {
    const enabledProducts = products.filter(p => p.enabled);
    
    try {
      const mockupPromises = enabledProducts.map(product => {
        const designConfig = designConfigs[product.id] || {
          position: { x: 0.5, y: 0.5 },
          scale: 1.0,
          rotation: 0
        };

        return this.generatePreview(
          designUrl,
          product.templateId,
          product.selectedColor,
          designConfig
        );
      });

      const mockups = await Promise.all(mockupPromises);
      
      return mockups.reduce((acc, mockup, index) => {
        acc[enabledProducts[index].id] = mockup;
        return acc;
      }, {});
    } catch (error) {
      console.error('Generate all mockups error:', error);
      throw error;
    }
  }

  // Get available templates from API
  async getTemplates() {
    try {
      const response = await fetch(`${API_BASE_URL}/mockups/templates`, {
        credentials: 'include' // Include cookies for session auth
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      return data.templates;
    } catch (error) {
      console.error('Get templates error:', error);
      // Return default templates on error
      return [
        { id: 'tshirt_front', name: 'T-Shirt Front', category: 'apparel' },
        { id: 'hoodie_front', name: 'Hoodie Front', category: 'apparel' },
        { id: 'mug_wrap', name: 'Mug Wrap', category: 'drinkware' }
      ];
    }
  }

  // Clear mockup cache
  clearCache() {
    this.mockupCache.clear();
  }

  // Convert canvas positioning to API format
  convertToApiPosition(canvasPosition, canvasSize) {
    // Convert pixel coordinates to normalized 0-1 range
    return {
      x: canvasPosition.x / canvasSize.width,
      y: canvasPosition.y / canvasSize.height
    };
  }

  // Calculate scale factor for API
  calculateApiScale(designSize, canvasSize, userScale) {
    // Base scale relative to canvas
    const baseScale = designSize.width / canvasSize.width;
    return baseScale * userScale;
  }
}

// Export singleton instance
export default new MockupService();