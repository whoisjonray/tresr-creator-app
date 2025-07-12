const express = require('express');
const router = express.Router();
const dynamicMockupsService = require('../services/dynamicMockups');
const { requireAuth } = require('../middleware/auth');

// Generate mockups for a design
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { 
      designUrl,
      products,
      designConfig 
    } = req.body;

    if (!designUrl || !products || !products.length) {
      return res.status(400).json({ 
        error: 'Design URL and products are required' 
      });
    }

    // Generate mockups for each product/color combination
    const mockupPromises = [];
    
    for (const product of products) {
      for (const color of product.colors) {
        mockupPromises.push(
          dynamicMockupsService.generateMockup({
            template_id: product.templateId,
            design_url: designUrl,
            color: color,
            position: designConfig.position || { x: 0.5, y: 0.5 },
            scale: designConfig.scale || 1.0,
            rotation: designConfig.rotation || 0
          })
        );
      }
    }

    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < mockupPromises.length; i += batchSize) {
      const batch = mockupPromises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      
      // Progress update
      const progress = Math.round((i + batch.length) / mockupPromises.length * 100);
      console.log(`Mockup generation progress: ${progress}%`);
    }

    res.json({
      success: true,
      mockups: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error generating mockups:', error);
    res.status(500).json({ 
      error: 'Failed to generate mockups',
      message: error.message 
    });
  }
});

// Preview a single mockup
router.post('/preview', requireAuth, async (req, res) => {
  try {
    const { 
      designUrl,
      templateId,
      color,
      designConfig 
    } = req.body;

    console.log('Preview request received:', { designUrl: designUrl ? 'present' : 'missing', templateId, color, designConfig });

    if (!designUrl || !templateId || !color) {
      console.log('Missing required fields:', { 
        designUrl: !designUrl, 
        templateId: !templateId, 
        color: !color 
      });
      return res.status(400).json({ 
        error: 'Design URL, template ID, and color are required',
        received: { designUrl: !!designUrl, templateId: !!templateId, color: !!color }
      });
    }

    const mockup = await dynamicMockupsService.generateMockup({
      template_id: templateId,
      design_url: designUrl,
      color: color,
      position: designConfig?.position || { x: 0.5, y: 0.5 },
      scale: designConfig?.scale || 1.0,
      rotation: designConfig?.rotation || 0
    });

    res.json({
      success: true,
      mockup
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    
    // Return a fallback placeholder instead of error
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#cccccc"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#333" 
              font-family="Arial" font-size="24" dy=".3em">
          ${templateId || 'Product'}
        </text>
      </svg>
    `;
    
    const fallbackMockup = {
      url: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      templateId: templateId,
      color: color || 'Default'
    };
    
    res.json({
      success: true,
      mockup: fallbackMockup,
      fallback: true
    });
  }
});

// Get available mockup templates
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const templates = await dynamicMockupsService.getTemplates();
    
    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      message: error.message 
    });
  }
});

// Upload design image
router.post('/upload-design', requireAuth, async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        error: 'Image data is required' 
      });
    }
    
    // For development, just return the data URL
    // In production, you'd upload to Cloudinary, S3, or Dynamic Mockups
    const designUrl = image.startsWith('data:') ? image : `data:image/png;base64,${image}`;

    res.json({
      success: true,
      designUrl
    });

  } catch (error) {
    console.error('Error uploading design:', error);
    res.status(500).json({ 
      error: 'Failed to upload design',
      message: error.message 
    });
  }
});

module.exports = router;