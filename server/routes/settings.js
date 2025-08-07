const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Admin check middleware
const requireAdmin = (req, res, next) => {
  // Check both user and creator session formats
  const email = req.session?.creator?.email || req.session?.user?.email;
  
  console.log('Admin check - Session email:', email);
  
  // Only allow whoisjonray@gmail.com for now
  if (email === 'whoisjonray@gmail.com') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'Admin access required',
      currentUser: email 
    });
  }
};

// Get current print areas (global settings)
router.get('/print-areas', async (req, res) => {
  try {
    // Try to load from database or config file
    const configPath = path.join(__dirname, '../config/printAreas.json');
    
    try {
      const data = await fs.readFile(configPath, 'utf8');
      const printAreas = JSON.parse(data);
      
      res.json({
        success: true,
        printAreas: printAreas
      });
    } catch (error) {
      // Return defaults if no saved config
      res.json({
        success: true,
        printAreas: null,
        message: 'Using default print areas'
      });
    }
  } catch (error) {
    console.error('Error loading print areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load print areas'
    });
  }
});

// Save print areas (admin only - affects ALL users)
router.post('/print-areas', requireAdmin, async (req, res) => {
  try {
    const { printAreas } = req.body;
    
    if (!printAreas) {
      return res.status(400).json({
        success: false,
        error: 'No print areas provided'
      });
    }
    
    // Create config directory if it doesn't exist
    const configDir = path.join(__dirname, '../config');
    await fs.mkdir(configDir, { recursive: true });
    
    // Save to config file (this affects ALL users globally)
    const configPath = path.join(configDir, 'printAreas.json');
    await fs.writeFile(configPath, JSON.stringify(printAreas, null, 2));
    
    // Also update the client-side config file if needed
    const clientConfigPath = path.join(__dirname, '../../client/src/config/printAreas.json');
    try {
      await fs.writeFile(clientConfigPath, JSON.stringify(printAreas, null, 2));
    } catch (clientError) {
      console.log('Could not update client config:', clientError.message);
    }
    
    const email = req.session?.creator?.email || req.session?.user?.email;
    console.log(`✅ Global print areas updated by ${email}`);
    console.log('Print areas:', printAreas);
    
    res.json({
      success: true,
      message: 'Print areas saved globally for all users',
      updatedBy: email,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error saving print areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save print areas'
    });
  }
});

// Get all global settings
router.get('/global', async (req, res) => {
  try {
    const settings = {
      printAreas: null,
      dtgPlatenSize: { width: 14, height: 20, unit: 'inches' },
      canvasSize: { width: 600, height: 600 },
      defaultScale: 0.35
    };
    
    // Load print areas if saved
    try {
      const configPath = path.join(__dirname, '../config/printAreas.json');
      const data = await fs.readFile(configPath, 'utf8');
      settings.printAreas = JSON.parse(data);
    } catch (error) {
      // Use defaults
    }
    
    res.json({
      success: true,
      settings
    });
    
  } catch (error) {
    console.error('Error loading global settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load settings'
    });
  }
});

// Get all product templates
router.get('/product-templates', async (req, res) => {
  try {
    const templatesPath = path.join(__dirname, '../config/productTemplates.json');
    const defaultTemplates = require('../config/defaultProductTemplates');
    
    try {
      const data = await fs.readFile(templatesPath, 'utf8');
      const customTemplates = JSON.parse(data);
      
      // Merge default templates with custom ones
      // Custom templates override defaults with same ID
      const templateMap = new Map();
      
      // Add defaults first
      defaultTemplates.forEach(t => templateMap.set(t.id, t));
      
      // Override/add custom templates
      customTemplates.forEach(t => templateMap.set(t.id, t));
      
      const mergedTemplates = Array.from(templateMap.values());
      
      res.json({
        success: true,
        templates: mergedTemplates
      });
    } catch (error) {
      // Return default templates if no saved config
      res.json({
        success: true,
        templates: defaultTemplates
      });
    }
  } catch (error) {
    console.error('Error loading product templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load product templates'
    });
  }
});

// Create new product template (admin only)
router.post('/product-templates/create', requireAdmin, async (req, res) => {
  try {
    const configDir = path.join(__dirname, '../config');
    const templatesPath = path.join(configDir, 'productTemplates.json');
    
    // Load existing templates OR default templates
    let templates = [];
    try {
      const data = await fs.readFile(templatesPath, 'utf8');
      templates = JSON.parse(data);
    } catch (error) {
      // Start with default templates if no file exists
      const defaultTemplates = require('../config/defaultProductTemplates');
      templates = [...defaultTemplates];
    }
    
    // Add new template
    const email = req.session?.creator?.email || req.session?.user?.email;
    const newTemplate = {
      ...req.body,
      createdAt: new Date().toISOString(),
      createdBy: email
    };
    
    templates.push(newTemplate);
    
    // Save updated templates
    await fs.writeFile(templatesPath, JSON.stringify(templates, null, 2));
    
    console.log(`✅ New product template created: ${newTemplate.name} by ${email}`);
    
    res.json({
      success: true,
      template: newTemplate,
      message: 'Product template created successfully'
    });
    
  } catch (error) {
    console.error('Error creating product template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product template'
    });
  }
});

// Update product template (admin only)
router.post('/product-templates/update', requireAdmin, async (req, res) => {
  try {
    const configDir = path.join(__dirname, '../config');
    const templatesPath = path.join(configDir, 'productTemplates.json');
    
    // Load existing templates
    let templates = [];
    try {
      const data = await fs.readFile(templatesPath, 'utf8');
      templates = JSON.parse(data);
    } catch (error) {
      templates = [];
    }
    
    // Find and update template
    const index = templates.findIndex(t => t.id === req.body.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const email = req.session?.creator?.email || req.session?.user?.email;
    templates[index] = {
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: email
    };
    
    // Save updated templates
    await fs.writeFile(templatesPath, JSON.stringify(templates, null, 2));
    
    console.log(`✅ Product template updated: ${req.body.name} by ${email}`);
    
    res.json({
      success: true,
      template: templates[index],
      message: 'Product template updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating product template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product template'
    });
  }
});

// Delete product template (admin only)
router.delete('/product-templates/:templateId', requireAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;
    const configDir = path.join(__dirname, '../config');
    const templatesPath = path.join(configDir, 'productTemplates.json');
    
    // Load existing templates
    let templates = [];
    try {
      const data = await fs.readFile(templatesPath, 'utf8');
      templates = JSON.parse(data);
    } catch (error) {
      templates = [];
    }
    
    // Filter out the template to delete
    const filteredTemplates = templates.filter(t => t.id !== templateId);
    
    if (filteredTemplates.length === templates.length) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Save updated templates
    await fs.writeFile(templatesPath, JSON.stringify(filteredTemplates, null, 2));
    
    const email = req.session?.creator?.email || req.session?.user?.email;
    console.log(`✅ Product template deleted: ${templateId} by ${email}`);
    
    res.json({
      success: true,
      message: 'Product template deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting product template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product template'
    });
  }
});

// Upload template image (admin only)
router.post('/upload-template-image', requireAdmin, async (req, res) => {
  try {
    const { image, imageType, templateId, color } = req.body;
    
    if (!image || !imageType) {
      return res.status(400).json({
        success: false,
        error: 'Image and imageType are required'
      });
    }
    
    // For now, we'll save images locally as base64 in the config
    // Later this can be replaced with actual Cloudinary upload
    
    // If Cloudinary credentials are available, use them
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const cloudinary = require('cloudinary').v2;
      
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      
      try {
        // Create public_id based on whether it's color-specific or not
        const publicId = color 
          ? `${templateId}-${imageType}-${color.toLowerCase().replace(/\s+/g, '-')}`
          : `${templateId}-${imageType}`;
        
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: `tresr-templates/${templateId}`,
          public_id: publicId,
          overwrite: true,
          resource_type: 'auto'
        });
        
        console.log(`✅ Template image uploaded: ${templateId}/${imageType}${color ? ` (${color})` : ''}`);
        
        res.json({
          success: true,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          color: color || null
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        throw cloudinaryError;
      }
    } else {
      // Fallback: Store as data URL in template config
      // This is less ideal but works for testing
      console.log('⚠️ Cloudinary not configured, storing image as data URL');
      
      res.json({
        success: true,
        url: image, // Return the base64 data URL directly
        publicId: `local-${templateId}-${imageType}${color ? `-${color}` : ''}`,
        color: color || null,
        isDataUrl: true
      });
    }
    
  } catch (error) {
    console.error('Error uploading template image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

module.exports = router;