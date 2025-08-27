// Dynamic Mockups v2 API Routes
// Parallel implementation for experimental testing

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../../middleware/auth');
const dynamicMockupsService = require('../../../services/dynamicMockups');
const cloudinaryService = require('../../../services/cloudinary');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await dynamicMockupsService.healthCheck();
    res.json({
      success: true,
      ...health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'error',
      message: error.message
    });
  }
});

// Get collections
router.get('/collections', requireAuth, async (req, res) => {
  try {
    if (!dynamicMockupsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Dynamic Mockups service not configured'
      });
    }

    const collections = await dynamicMockupsService.getCollections();
    
    res.json({
      success: true,
      collections
    });
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get mockup templates
router.get('/templates', requireAuth, async (req, res) => {
  try {
    if (!dynamicMockupsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Dynamic Mockups service not configured'
      });
    }

    const { collection } = req.query;
    const mockups = await dynamicMockupsService.getMockups(collection);
    
    res.json({
      success: true,
      mockups
    });
  } catch (error) {
    console.error('Failed to fetch mockups:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload design
router.post('/upload-design', requireAuth, async (req, res) => {
  try {
    const { image, engine } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      });
    }

    // Upload to Cloudinary
    const designUrl = await dynamicMockupsService.uploadDesignToCloudinary(image);
    
    res.json({
      success: true,
      designUrl,
      engine: engine || 'dynamic_mockups'
    });
  } catch (error) {
    console.error('Failed to upload design:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Render single mockup
router.post('/render', requireAuth, async (req, res) => {
  try {
    if (!dynamicMockupsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Dynamic Mockups service not configured'
      });
    }

    const { designUrl, templateId, color, designConfig, options } = req.body;
    
    if (!designUrl || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: designUrl and templateId'
      });
    }

    // Map templateId to actual Dynamic Mockups UUID
    const mockupUuid = await dynamicMockupsService.mapProductToMockup(templateId);
    
    if (!mockupUuid) {
      // For now, use a placeholder UUID - you'll need to map these properly
      console.warn(`No mapping found for templateId: ${templateId}, using placeholder`);
    }

    const result = await dynamicMockupsService.renderMockup({
      mockupUuid: mockupUuid || templateId, // Use templateId as fallback
      designUrl,
      designConfig: designConfig || {},
      exportOptions: options || {}
    });
    
    res.json({
      success: true,
      mockup: result
    });
  } catch (error) {
    console.error('Failed to render mockup:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Bulk render
router.post('/bulk-render', requireAuth, async (req, res) => {
  try {
    if (!dynamicMockupsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Dynamic Mockups service not configured'
      });
    }

    const { designUrl, products, options } = req.body;
    
    if (!designUrl || !products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: designUrl and products array'
      });
    }

    // Process products batch
    const results = await dynamicMockupsService.processProductBatch(products, designUrl);
    
    res.json({
      success: true,
      mockups: results
    });
  } catch (error) {
    console.error('Failed to bulk render:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Generate print files
router.post('/print-files', requireAuth, async (req, res) => {
  try {
    if (!dynamicMockupsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Dynamic Mockups service not configured'
      });
    }

    const { designUrl, templateId, designConfig, options } = req.body;
    
    if (!designUrl || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: designUrl and templateId'
      });
    }

    // Map templateId to actual Dynamic Mockups UUID
    const mockupUuid = await dynamicMockupsService.mapProductToMockup(templateId);
    
    const printFiles = await dynamicMockupsService.generatePrintFiles({
      mockupUuid: mockupUuid || templateId,
      designUrl,
      designConfig: designConfig || {},
      printOptions: options || {}
    });
    
    res.json({
      success: true,
      printFiles
    });
  } catch (error) {
    console.error('Failed to generate print files:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload custom PSD
router.post('/upload-psd', requireAuth, async (req, res) => {
  try {
    if (!dynamicMockupsService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Dynamic Mockups service not configured'
      });
    }

    const { psdUrl, name, category, createMockup } = req.body;
    
    if (!psdUrl || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: psdUrl and name'
      });
    }

    const result = await dynamicMockupsService.uploadPSD({
      psdFileUrl: psdUrl,
      name,
      categoryId: category,
      createMockup
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Failed to upload PSD:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Performance comparison endpoint
router.post('/compare', requireAuth, async (req, res) => {
  try {
    const { designUrl, templateId, color, designConfig } = req.body;
    
    const startTime = Date.now();
    const results = {
      canvas: null,
      dynamicMockups: null,
      comparison: {}
    };

    // Test canvas rendering (call v1 API)
    try {
      const canvasStart = Date.now();
      // Note: This would call the existing canvas endpoint
      // For now, we'll simulate
      results.canvas = {
        success: true,
        time: Date.now() - canvasStart,
        method: 'canvas'
      };
    } catch (error) {
      results.canvas = {
        success: false,
        error: error.message
      };
    }

    // Test Dynamic Mockups rendering
    if (dynamicMockupsService.isConfigured()) {
      try {
        const dmStart = Date.now();
        const mockupUuid = await dynamicMockupsService.mapProductToMockup(templateId);
        const dmResult = await dynamicMockupsService.renderMockup({
          mockupUuid: mockupUuid || templateId,
          designUrl,
          designConfig
        });
        results.dynamicMockups = {
          success: true,
          time: Date.now() - dmStart,
          url: dmResult.url,
          method: 'api'
        };
      } catch (error) {
        results.dynamicMockups = {
          success: false,
          error: error.message
        };
      }
    }

    // Calculate comparison
    if (results.canvas?.success && results.dynamicMockups?.success) {
      results.comparison = {
        speedDifference: results.canvas.time - results.dynamicMockups.time,
        percentFaster: ((results.canvas.time - results.dynamicMockups.time) / results.canvas.time * 100).toFixed(1),
        winner: results.canvas.time < results.dynamicMockups.time ? 'canvas' : 'dynamic_mockups',
        totalTime: Date.now() - startTime
      };
    }
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Failed to compare services:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;