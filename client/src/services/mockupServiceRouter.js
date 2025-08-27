// Intelligent Mockup Service Router
// Routes between canvas-based and Dynamic Mockups services based on feature flags and context

import mockupServiceCanvas from './mockupService';
import mockupServiceDM from './mockupServiceDM';
import { FEATURES, getMockupServiceMode, isUserInBeta, trackMockupPerformance } from '../config/featureFlags';

class MockupServiceRouter {
  constructor() {
    this.currentMode = null;
    this.userId = null;
    this.overrideMode = null; // For testing specific services
  }

  // Set the current user for beta testing checks
  setUser(userId) {
    this.userId = userId;
    this.currentMode = getMockupServiceMode(userId);
    console.log(`🔄 Router: Set mode to ${this.currentMode} for user ${userId}`);
  }

  // Override the service mode (useful for testing)
  setOverrideMode(mode) {
    this.overrideMode = mode;
    console.log(`🔄 Router: Override mode set to ${mode}`);
  }

  // Clear override and use automatic routing
  clearOverride() {
    this.overrideMode = null;
    console.log('🔄 Router: Override cleared, using automatic routing');
  }

  // Get the current service based on routing logic
  getCurrentService() {
    // Check for override first
    if (this.overrideMode) {
      return this.getServiceByMode(this.overrideMode);
    }

    // Use configured mode for user
    const mode = this.currentMode || getMockupServiceMode(this.userId);
    return this.getServiceByMode(mode);
  }

  // Get service by explicit mode
  getServiceByMode(mode) {
    switch (mode) {
      case 'dynamic_mockups':
      case 'api':
      case 'embed':
      case 'hybrid':
        console.log('🎨 Router: Using Dynamic Mockups service');
        return mockupServiceDM;
      
      case 'canvas':
      default:
        console.log('🖼️ Router: Using Canvas service');
        return mockupServiceCanvas;
    }
  }

  // Upload design with intelligent routing
  async uploadDesign(imageDataUrl) {
    const service = this.getCurrentService();
    const startTime = Date.now();
    
    try {
      const result = await service.uploadDesign(imageDataUrl);
      
      trackMockupPerformance('upload_design_routed', Date.now() - startTime, {
        service: service === mockupServiceDM ? 'dynamic_mockups' : 'canvas',
        success: true
      });
      
      return result;
    } catch (error) {
      // Try fallback service if enabled and primary fails
      if (FEATURES.FALLBACK_TO_CANVAS && service === mockupServiceDM) {
        console.log('⚠️ Router: Primary service failed, trying canvas fallback');
        return mockupServiceCanvas.uploadDesign(imageDataUrl);
      }
      throw error;
    }
  }

  // Generate preview with intelligent routing
  async generatePreview(designUrl, templateId, color, designConfig) {
    const service = this.getCurrentService();
    const startTime = Date.now();
    
    try {
      const result = await service.generatePreview(designUrl, templateId, color, designConfig);
      
      trackMockupPerformance('generate_preview_routed', Date.now() - startTime, {
        service: service === mockupServiceDM ? 'dynamic_mockups' : 'canvas',
        success: true
      });
      
      return result;
    } catch (error) {
      // Try fallback service if enabled and primary fails
      if (FEATURES.FALLBACK_TO_CANVAS && service === mockupServiceDM) {
        console.log('⚠️ Router: Primary service failed, trying canvas fallback');
        return mockupServiceCanvas.generatePreview(designUrl, templateId, color, designConfig);
      }
      throw error;
    }
  }

  // Generate all mockups with optimal service selection
  async generateAllMockups(designUrl, products, designConfigs) {
    const service = this.getCurrentService();
    
    // Use bulk render if available with Dynamic Mockups
    if (service === mockupServiceDM && FEATURES.ENABLE_BULK_RENDER && products.length > 3) {
      console.log('🚀 Router: Using bulk render for efficiency');
      return mockupServiceDM.bulkRender(designUrl, products, designConfigs);
    }
    
    // Otherwise use standard generation
    return service.generateAllMockups(designUrl, products, designConfigs);
  }

  // Get templates based on service
  async getTemplates() {
    const service = this.getCurrentService();
    
    if (service === mockupServiceDM) {
      // Get Dynamic Mockups templates
      const collections = await mockupServiceDM.getCollections();
      const mockups = await mockupServiceDM.getMockups();
      
      // Map to expected format
      return mockups.map(m => ({
        id: m.uuid,
        name: m.name,
        category: m.collection?.name || 'uncategorized',
        thumbnail: m.thumbnail
      }));
    } else {
      // Get canvas templates
      return mockupServiceCanvas.getTemplates();
    }
  }

  // Generate print files (only available with Dynamic Mockups)
  async generatePrintFiles(designUrl, product, designConfig) {
    if (!FEATURES.ENABLE_PRINT_FILES) {
      console.log('⚠️ Router: Print files disabled');
      return null;
    }

    // Print files only available with Dynamic Mockups
    if (this.getCurrentService() === mockupServiceDM) {
      return mockupServiceDM.generatePrintFiles(designUrl, product, designConfig);
    }

    console.log('⚠️ Router: Print files not available with canvas service');
    return null;
  }

  // Compare services (for testing and dashboard)
  async compareServices(designUrl, templateId, color, designConfig) {
    console.log('🔬 Router: Comparing services...');
    
    const results = {};
    const startTime = Date.now();

    // Test canvas service
    try {
      const canvasStart = Date.now();
      const canvasResult = await mockupServiceCanvas.generatePreview(
        designUrl, templateId, color, designConfig
      );
      results.canvas = {
        success: true,
        time: Date.now() - canvasStart,
        url: canvasResult.url || canvasResult,
        size: canvasResult.imageSizeKB || 'N/A'
      };
    } catch (error) {
      results.canvas = {
        success: false,
        error: error.message
      };
    }

    // Test Dynamic Mockups service
    try {
      const dmStart = Date.now();
      const dmResult = await mockupServiceDM.generatePreview(
        designUrl, templateId, color, designConfig
      );
      results.dynamicMockups = {
        success: true,
        time: Date.now() - dmStart,
        url: dmResult.url || dmResult,
        size: dmResult.imageSizeKB || 'N/A'
      };
    } catch (error) {
      results.dynamicMockups = {
        success: false,
        error: error.message
      };
    }

    // Calculate comparison metrics
    if (results.canvas.success && results.dynamicMockups.success) {
      results.comparison = {
        speedDifference: results.canvas.time - results.dynamicMockups.time,
        percentFaster: ((results.canvas.time - results.dynamicMockups.time) / results.canvas.time * 100).toFixed(1),
        winner: results.canvas.time < results.dynamicMockups.time ? 'canvas' : 'dynamic_mockups'
      };
    }

    results.totalTime = Date.now() - startTime;
    
    console.log('📊 Router: Comparison complete', results);
    return results;
  }

  // Clear caches for all services
  clearAllCaches() {
    console.log('🧹 Router: Clearing all service caches');
    mockupServiceCanvas.clearCache();
    mockupServiceDM.clearCache();
  }

  // Get service statistics
  getServiceStats() {
    const stats = {
      currentMode: this.currentMode || 'not_set',
      overrideMode: this.overrideMode,
      userId: this.userId,
      isUserInBeta: isUserInBeta(this.userId),
      features: {
        dynamicMockupsEnabled: FEATURES.USE_DYNAMIC_MOCKUPS,
        mode: FEATURES.DYNAMIC_MOCKUPS_MODE,
        bulkRenderEnabled: FEATURES.ENABLE_BULK_RENDER,
        printFilesEnabled: FEATURES.ENABLE_PRINT_FILES,
        fallbackEnabled: FEATURES.FALLBACK_TO_CANVAS
      }
    };

    // Add cache stats from both services
    if (mockupServiceCanvas.getCacheStats) {
      stats.canvasCache = mockupServiceCanvas.getCacheStats();
    }
    
    stats.dynamicMockupsCache = mockupServiceDM.getCacheStats();
    
    return stats;
  }

  // Intelligent service selection based on requirements
  async selectOptimalService(requirements) {
    const { hasText, hasMultipleLayers, needsPrintFiles, productCount } = requirements;
    
    // If text or layers, use Dynamic Mockups
    if (hasText || hasMultipleLayers) {
      console.log('🎯 Router: Selecting Dynamic Mockups for advanced features');
      return mockupServiceDM;
    }
    
    // If print files needed, use Dynamic Mockups
    if (needsPrintFiles) {
      console.log('🎯 Router: Selecting Dynamic Mockups for print files');
      return mockupServiceDM;
    }
    
    // If bulk render would be beneficial, use Dynamic Mockups
    if (productCount > 5 && FEATURES.ENABLE_BULK_RENDER) {
      console.log('🎯 Router: Selecting Dynamic Mockups for bulk rendering');
      return mockupServiceDM;
    }
    
    // Otherwise, use canvas for speed
    console.log('🎯 Router: Selecting Canvas for simple, fast rendering');
    return mockupServiceCanvas;
  }
}

// Export singleton instance
const router = new MockupServiceRouter();

// Auto-detect user from auth context if available
if (typeof window !== 'undefined' && window.localStorage) {
  const authData = localStorage.getItem('auth_user');
  if (authData) {
    try {
      const user = JSON.parse(authData);
      router.setUser(user.id);
    } catch (e) {
      // Ignore parse errors
    }
  }
}

export default router;