const express = require('express');
const router = express.Router();
const dynamicMockupsService = require('../services/dynamicMockups');
const cloudinaryService = require('../services/cloudinary');
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

// Upload generated product images to Cloudinary
router.post('/upload-product-images', requireAuth, async (req, res) => {
  try {
    const { productName, variants } = req.body;
    const { creator } = req.session;
    
    if (!productName || !variants || !Array.isArray(variants)) {
      return res.status(400).json({ 
        error: 'Product name and variants are required' 
      });
    }
    
    console.log(`📤 Uploading ${variants.length} product images for "${productName}" to Cloudinary...`);
    
    // Upload each variant image to Cloudinary
    const uploadPromises = variants.map(async (variant, index) => {
      if (!variant.image || !variant.image.startsWith('data:')) {
        return { 
          success: false, 
          error: 'Invalid image data',
          variant 
        };
      }
      
      try {
        // Create a unique public ID for this variant
        const timestamp = Date.now();
        const public_id = `${creator.name.toLowerCase().replace(/\s+/g, '-')}/${productName.toLowerCase().replace(/\s+/g, '-')}-${variant.color.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
        
        const result = await cloudinaryService.uploadImage(variant.image, {
          folder: 'tresr-creator-products',
          public_id,
          tags: [
            'creator-product',
            'generated',
            `creator:${creator.name}`,
            `product:${productName}`,
            `color:${variant.color}`,
            `template:${variant.templateId || 'unknown'}`
          ]
        });
        
        return {
          success: true,
          color: variant.color,
          cloudinaryUrl: result.url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes
        };
        
      } catch (error) {
        console.error(`Failed to upload variant ${variant.color}:`, error);
        return {
          success: false,
          color: variant.color,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Uploaded ${successful.length}/${variants.length} images successfully`);
    if (failed.length > 0) {
      console.log(`❌ Failed to upload ${failed.length} images`);
    }
    
    res.json({
      success: true,
      uploaded: successful.length,
      failed: failed.length,
      results
    });

  } catch (error) {
    console.error('Error uploading product images:', error);
    res.status(500).json({ 
      error: 'Failed to upload product images',
      message: error.message 
    });
  }
});

// Upload a single product image to Cloudinary
router.post('/upload-single-image', requireAuth, async (req, res) => {
  try {
    const { productName, imageUrl, productId, color } = req.body;
    const { creator } = req.session;
    
    if (!productName || !imageUrl || !productId || !color) {
      return res.status(400).json({ 
        error: 'Product name, image URL, product ID, and color are required' 
      });
    }

    // Generate a safe public ID
    const timestamp = new Date().toISOString().split('T')[0];
    const safeProductName = productName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const safeCreatorId = creator.id.replace(/[^a-zA-Z0-9-_]/g, '_');
    const public_id = `${safeCreatorId}_${safeProductName}_${color}_${timestamp}`;

    console.log(`📤 Uploading single image to Cloudinary: ${public_id}`);

    // Upload to Cloudinary
    const result = await cloudinaryService.uploadImage(imageUrl, {
      folder: 'tresr-creator-products',
      public_id,
      tags: [
        'creator-product',
        'generated',
        `creator:${creator.id}`,
        `product:${productId}`,
        `color:${color}`
      ],
      overwrite: true
    });

    console.log(`✅ Successfully uploaded single image to Cloudinary: ${result.secure_url}`);

    res.json({
      success: true,
      cloudinaryUrl: result.secure_url,
      productId,
      color,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Error uploading single image:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      message: error.message 
    });
  }
});

module.exports = router;