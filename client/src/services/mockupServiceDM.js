// Dynamic Mockups API Service
// This is the experimental service for Dynamic Mockups integration
// Parallel to mockupService.js to allow safe experimentation

import { FEATURES, trackMockupPerformance } from '../config/featureFlags';

const getApiBaseURL = () => {
  const currentHost = window.location.hostname;
  
  if (currentHost.includes('ngrok') || currentHost === 'localhost') {
    return window.location.origin + '/api/v2'; // Note: v2 for Dynamic Mockups endpoints
  }
  
  if (currentHost === 'creators.tresr.com') {
    return 'https://creators.tresr.com/api/v2';
  }
  
  return 'http://localhost:3002/api/v2';
};

const API_BASE_URL = getApiBaseURL();

class DynamicMockupsService {
  constructor() {
    this.mockupCache = new Map();
    this.collectionsCache = null;
    this.templatesCache = new Map();
  }

  // Upload design to Dynamic Mockups
  async uploadDesign(imageDataUrl) {
    const startTime = Date.now();
    
    try {
      console.log('🎨 [DM] Uploading design to Dynamic Mockups...');
      
      const response = await fetch(`${API_BASE_URL}/mockups/upload-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          image: imageDataUrl,
          engine: 'dynamic_mockups' // Flag for backend to use DM
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      trackMockupPerformance('upload_design', Date.now() - startTime, {
        success: true,
        size: imageDataUrl.length
      });
      
      console.log('✅ [DM] Design uploaded successfully');
      return data.designUrl;
      
    } catch (error) {
      console.error('❌ [DM] Upload design error:', error);
      
      trackMockupPerformance('upload_design', Date.now() - startTime, {
        success: false,
        error: error.message
      });
      
      // Fallback to canvas if enabled
      if (FEATURES.FALLBACK_TO_CANVAS) {
        console.log('⚠️ [DM] Falling back to canvas service');
        const { default: canvasService } = await import('./mockupService');
        return canvasService.uploadDesign(imageDataUrl);
      }
      
      throw error;
    }
  }

  // Get available collections from Dynamic Mockups
  async getCollections() {
    if (this.collectionsCache && FEATURES.ENABLE_DM_CACHE) {
      return this.collectionsCache;
    }

    const startTime = Date.now();

    try {
      console.log('📚 [DM] Fetching collections...');
      
      const response = await fetch(`${API_BASE_URL}/mockups/collections`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }

      const data = await response.json();
      this.collectionsCache = data.collections;
      
      trackMockupPerformance('get_collections', Date.now() - startTime, {
        success: true,
        count: data.collections.length
      });
      
      console.log(`✅ [DM] Fetched ${data.collections.length} collections`);
      return data.collections;
      
    } catch (error) {
      console.error('❌ [DM] Get collections error:', error);
      
      trackMockupPerformance('get_collections', Date.now() - startTime, {
        success: false,
        error: error.message
      });
      
      // Return default collections on error
      return [];
    }
  }

  // Get mockup templates for a collection
  async getMockups(collectionId = null) {
    const cacheKey = collectionId || 'all';
    
    if (this.templatesCache.has(cacheKey) && FEATURES.ENABLE_DM_CACHE) {
      return this.templatesCache.get(cacheKey);
    }

    const startTime = Date.now();

    try {
      console.log(`🎭 [DM] Fetching mockups${collectionId ? ` for collection ${collectionId}` : ''}...`);
      
      const url = collectionId 
        ? `${API_BASE_URL}/mockups/templates?collection=${collectionId}`
        : `${API_BASE_URL}/mockups/templates`;
        
      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch mockups: ${response.statusText}`);
      }

      const data = await response.json();
      this.templatesCache.set(cacheKey, data.mockups);
      
      trackMockupPerformance('get_mockups', Date.now() - startTime, {
        success: true,
        count: data.mockups.length,
        collection: collectionId
      });
      
      console.log(`✅ [DM] Fetched ${data.mockups.length} mockups`);
      return data.mockups;
      
    } catch (error) {
      console.error('❌ [DM] Get mockups error:', error);
      
      trackMockupPerformance('get_mockups', Date.now() - startTime, {
        success: false,
        error: error.message
      });
      
      return [];
    }
  }

  // Generate preview using Dynamic Mockups API
  async generatePreview(designUrl, templateId, color, designConfig) {
    const startTime = Date.now();
    
    console.log('🎨 [DM] Generating preview:', { 
      designUrl: designUrl ? 'present' : 'missing', 
      templateId, 
      color, 
      designConfig 
    });
    
    // Validate inputs
    if (!designUrl || !templateId) {
      console.warn('[DM] Missing required data for preview generation');
      
      if (FEATURES.FALLBACK_TO_CANVAS) {
        const { default: canvasService } = await import('./mockupService');
        return canvasService.generatePreview(designUrl, templateId, color, designConfig);
      }
      
      throw new Error('Missing required data for preview generation');
    }
    
    const cacheKey = `dm-${templateId}-${color}-${JSON.stringify(designConfig)}`;
    
    // Check cache first
    if (this.mockupCache.has(cacheKey) && FEATURES.ENABLE_DM_CACHE) {
      console.log('📦 [DM] Returning cached preview');
      return this.mockupCache.get(cacheKey);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mockups/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          designUrl,
          templateId,
          color,
          designConfig,
          options: {
            format: 'webp', // Optimal for web
            size: 1200,     // High quality
            mode: 'download'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Render failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      if (FEATURES.ENABLE_DM_CACHE) {
        this.mockupCache.set(cacheKey, data.mockup);
        
        // Clear old cache entries if too many
        if (this.mockupCache.size > 50) {
          const firstKey = this.mockupCache.keys().next().value;
          this.mockupCache.delete(firstKey);
        }
      }
      
      trackMockupPerformance('generate_preview', Date.now() - startTime, {
        success: true,
        templateId,
        color,
        cached: false
      });
      
      console.log('✅ [DM] Preview generated successfully');
      return data.mockup;
      
    } catch (error) {
      console.error('❌ [DM] Preview generation failed:', error);
      
      trackMockupPerformance('generate_preview', Date.now() - startTime, {
        success: false,
        error: error.message
      });
      
      // Fallback to canvas if enabled
      if (FEATURES.FALLBACK_TO_CANVAS) {
        console.log('⚠️ [DM] Falling back to canvas preview');
        const { default: canvasService } = await import('./mockupService');
        return canvasService.generatePreview(designUrl, templateId, color, designConfig);
      }
      
      throw error;
    }
  }

  // Bulk render multiple mockups at once
  async bulkRender(designUrl, products, designConfigs) {
    if (!FEATURES.ENABLE_BULK_RENDER) {
      // Fall back to individual renders
      return this.generateAllMockups(designUrl, products, designConfigs);
    }

    const startTime = Date.now();
    const enabledProducts = products.filter(p => p.enabled);
    
    console.log(`🎨 [DM] Bulk rendering ${enabledProducts.length} products`);

    try {
      const response = await fetch(`${API_BASE_URL}/mockups/bulk-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          designUrl,
          products: enabledProducts.map(product => ({
            id: product.id,
            templateId: product.dynamicMockupId || product.templateId,
            color: product.selectedColor,
            designConfig: designConfigs[product.id] || {
              position: { x: 0.5, y: 0.5 },
              scale: 1.0,
              rotation: 0
            }
          })),
          options: {
            format: 'webp',
            size: 1200,
            parallel: true // Process in parallel on server
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Bulk render failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      trackMockupPerformance('bulk_render', Date.now() - startTime, {
        success: true,
        count: enabledProducts.length,
        totalTime: Date.now() - startTime
      });
      
      console.log(`✅ [DM] Bulk render completed in ${Date.now() - startTime}ms`);
      
      // Convert to expected format
      return data.mockups.reduce((acc, mockup) => {
        acc[mockup.productId] = mockup.imageUrl;
        return acc;
      }, {});
      
    } catch (error) {
      console.error('❌ [DM] Bulk render failed:', error);
      
      trackMockupPerformance('bulk_render', Date.now() - startTime, {
        success: false,
        error: error.message
      });
      
      // Fall back to individual renders
      console.log('⚠️ [DM] Falling back to individual renders');
      return this.generateAllMockups(designUrl, products, designConfigs);
    }
  }

  // Generate all mockups individually (fallback for bulk render)
  async generateAllMockups(designUrl, products, designConfigs) {
    const enabledProducts = products.filter(p => p.enabled);
    const startTime = Date.now();
    
    try {
      const mockupPromises = enabledProducts.map(product => {
        const designConfig = designConfigs[product.id] || {
          position: { x: 0.5, y: 0.5 },
          scale: 1.0,
          rotation: 0
        };

        return this.generatePreview(
          designUrl,
          product.dynamicMockupId || product.templateId,
          product.selectedColor,
          designConfig
        );
      });

      const mockups = await Promise.all(mockupPromises);
      
      trackMockupPerformance('generate_all', Date.now() - startTime, {
        success: true,
        count: enabledProducts.length
      });
      
      return mockups.reduce((acc, mockup, index) => {
        acc[enabledProducts[index].id] = mockup;
        return acc;
      }, {});
      
    } catch (error) {
      console.error('❌ [DM] Generate all mockups error:', error);
      
      trackMockupPerformance('generate_all', Date.now() - startTime, {
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }

  // Generate print files for production
  async generatePrintFiles(designUrl, product, designConfig) {
    if (!FEATURES.ENABLE_PRINT_FILES) {
      console.log('⚠️ [DM] Print files disabled');
      return null;
    }

    const startTime = Date.now();

    try {
      console.log('🖨️ [DM] Generating print files for', product.name);
      
      const response = await fetch(`${API_BASE_URL}/mockups/print-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          designUrl,
          templateId: product.dynamicMockupId || product.templateId,
          designConfig,
          options: {
            format: 'pdf',
            dpi: 300,
            colorProfile: 'CMYK',
            includeBleed: true,
            includeCutMarks: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Print file generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      trackMockupPerformance('generate_print_files', Date.now() - startTime, {
        success: true,
        productId: product.id
      });
      
      console.log('✅ [DM] Print files generated successfully');
      return data.printFiles;
      
    } catch (error) {
      console.error('❌ [DM] Print file generation error:', error);
      
      trackMockupPerformance('generate_print_files', Date.now() - startTime, {
        success: false,
        error: error.message
      });
      
      return null;
    }
  }

  // Upload custom PSD template
  async uploadCustomTemplate(psdUrl, name, category = 'custom') {
    const startTime = Date.now();

    try {
      console.log('📤 [DM] Uploading custom PSD template...');
      
      const response = await fetch(`${API_BASE_URL}/mockups/upload-psd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          psdUrl,
          name,
          category,
          createMockup: true
        })
      });

      if (!response.ok) {
        throw new Error(`PSD upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      trackMockupPerformance('upload_psd', Date.now() - startTime, {
        success: true,
        templateId: data.mockupId
      });
      
      console.log('✅ [DM] Custom template uploaded successfully');
      return data;
      
    } catch (error) {
      console.error('❌ [DM] PSD upload error:', error);
      
      trackMockupPerformance('upload_psd', Date.now() - startTime, {
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }

  // Clear all caches
  clearCache() {
    this.mockupCache.clear();
    this.collectionsCache = null;
    this.templatesCache.clear();
    console.log('🧹 [DM] Cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      mockupCacheSize: this.mockupCache.size,
      templatesCacheSize: this.templatesCache.size,
      hasCollectionsCache: !!this.collectionsCache,
      cacheEnabled: FEATURES.ENABLE_DM_CACHE
    };
  }

  // Compare with canvas rendering (for testing)
  async compareWithCanvas(designUrl, templateId, color, designConfig) {
    console.log('🔄 [DM] Comparing with canvas rendering...');
    
    const startDM = Date.now();
    const dmResult = await this.generatePreview(designUrl, templateId, color, designConfig);
    const dmTime = Date.now() - startDM;
    
    const { default: canvasService } = await import('./mockupService');
    const startCanvas = Date.now();
    const canvasResult = await canvasService.generatePreview(designUrl, templateId, color, designConfig);
    const canvasTime = Date.now() - startCanvas;
    
    const comparison = {
      dynamicMockups: {
        url: dmResult.url || dmResult,
        time: dmTime,
        size: dmResult.imageSizeKB || 'N/A'
      },
      canvas: {
        url: canvasResult.url || canvasResult,
        time: canvasTime,
        size: canvasResult.imageSizeKB || 'N/A'
      },
      speedup: ((canvasTime - dmTime) / canvasTime * 100).toFixed(1) + '%'
    };
    
    console.log('📊 [DM] Comparison complete:', comparison);
    return comparison;
  }
}

// Export singleton instance
export default new DynamicMockupsService();