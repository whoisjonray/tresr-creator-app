// Service for handling mockup generation with Dynamic Mockups API
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3002/api' 
  : 'https://creators.tresr.com/api';

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

  // Generate preview for a single product
  async generatePreview(designUrl, templateId, color, designConfig) {
    console.log('MockupService.generatePreview called with:', { 
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
      
      // Return fallback immediately
      const svg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#cccccc"/>
          <text x="50%" y="50%" text-anchor="middle" fill="#333" 
                font-family="Arial" font-size="24" dy=".3em">
            ${templateId || 'Product'}
          </text>
        </svg>
      `;
      
      return {
        url: `data:image/svg+xml;base64,${btoa(svg)}`,
        templateId: templateId || 'unknown',
        color: color || 'Default'
      };
    }
    
    const cacheKey = `${templateId}-${color}-${JSON.stringify(designConfig)}`;
    
    // Check cache first
    if (this.mockupCache.has(cacheKey)) {
      return this.mockupCache.get(cacheKey);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mockups/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session auth
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
    } catch (error) {
      console.error('Generate preview error:', error);
      // Return SVG placeholder on error
      const svg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#cccccc"/>
          <text x="50%" y="50%" text-anchor="middle" fill="#333" 
                font-family="Arial" font-size="24" dy=".3em">
            ${templateId || 'Product'}
          </text>
        </svg>
      `;
      
      return {
        url: `data:image/svg+xml;base64,${btoa(svg)}`,
        templateId,
        color
      };
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