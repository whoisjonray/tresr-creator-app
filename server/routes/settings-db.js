const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { ProductTemplate } = require('../models');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Get Cloudinary credentials (support both naming conventions)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
  console.log('✅ Cloudinary configured with cloud name:', cloudName);
} else {
  console.log('⚠️ Cloudinary not configured. Missing env vars:', {
    CLOUD_NAME: !!cloudName,
    API_KEY: !!apiKey,
    API_SECRET: !!apiSecret
  });
}

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

// Get all product templates (from database and defaults)
router.get('/product-templates', async (req, res) => {
  try {
    const defaultTemplates = require('../config/defaultProductTemplates');
    
    // If database is available, fetch custom templates
    let customTemplates = [];
    if (ProductTemplate) {
      try {
        customTemplates = await ProductTemplate.findAll({
          where: { isCustom: true },
          order: [['createdAt', 'DESC']]
        });
      } catch (dbError) {
        console.log('Database not available, using defaults only');
      }
    }
    
    // Merge default templates with custom ones
    // Custom templates override defaults with same ID
    const templateMap = new Map();
    
    // Add defaults first
    defaultTemplates.forEach(t => templateMap.set(t.id, t));
    
    // Override/add custom templates
    customTemplates.forEach(t => {
      const templateData = t.toJSON ? t.toJSON() : t;
      templateMap.set(templateData.id, templateData);
    });
    
    const mergedTemplates = Array.from(templateMap.values());
    
    res.json({
      success: true,
      templates: mergedTemplates
    });
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
    const email = req.session?.creator?.email || req.session?.user?.email;
    
    // Validate required fields
    if (!req.body.id || !req.body.name) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and name are required'
      });
    }
    
    // Check if template with this ID already exists
    if (ProductTemplate) {
      const existing = await ProductTemplate.findByPk(req.body.id);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Template with this ID already exists'
        });
      }
      
      // Create in database
      const newTemplate = await ProductTemplate.create({
        ...req.body,
        isCustom: true,
        createdBy: email
      });
      
      console.log(`✅ New product template created in database: ${newTemplate.name} by ${email}`);
      
      res.json({
        success: true,
        template: newTemplate.toJSON(),
        message: 'Product template created successfully'
      });
    } else {
      // Fallback to JSON file if database not available
      const configDir = path.join(__dirname, '../config');
      const templatesPath = path.join(configDir, 'productTemplates.json');
      
      let templates = [];
      try {
        const data = await fs.readFile(templatesPath, 'utf8');
        templates = JSON.parse(data);
      } catch (error) {
        templates = [];
      }
      
      const newTemplate = {
        ...req.body,
        isCustom: true,
        createdAt: new Date().toISOString(),
        createdBy: email
      };
      
      templates.push(newTemplate);
      await fs.writeFile(templatesPath, JSON.stringify(templates, null, 2));
      
      console.log(`✅ New product template created in JSON: ${newTemplate.name} by ${email}`);
      
      res.json({
        success: true,
        template: newTemplate,
        message: 'Product template created successfully (JSON fallback)'
      });
    }
    
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
    const email = req.session?.creator?.email || req.session?.user?.email;
    
    if (!req.body.id) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }
    
    if (ProductTemplate) {
      // Check if it's a custom template in database
      let template = await ProductTemplate.findByPk(req.body.id);
      
      if (!template) {
        // Create it as a custom template if it doesn't exist
        template = await ProductTemplate.create({
          ...req.body,
          isCustom: true,
          createdBy: email
        });
        console.log(`✅ Template ${req.body.name} saved to database by ${email}`);
      } else {
        // Update existing template
        await template.update({
          ...req.body,
          updatedBy: email
        });
        console.log(`✅ Product template updated in database: ${req.body.name} by ${email}`);
      }
      
      res.json({
        success: true,
        template: template.toJSON(),
        message: 'Product template updated successfully'
      });
    } else {
      // Fallback to JSON file
      const configDir = path.join(__dirname, '../config');
      const templatesPath = path.join(configDir, 'productTemplates.json');
      
      let templates = [];
      try {
        const data = await fs.readFile(templatesPath, 'utf8');
        templates = JSON.parse(data);
      } catch (error) {
        templates = [];
      }
      
      const index = templates.findIndex(t => t.id === req.body.id);
      
      if (index === -1) {
        // Add as new template
        templates.push({
          ...req.body,
          isCustom: true,
          createdAt: new Date().toISOString(),
          createdBy: email
        });
      } else {
        // Update existing
        templates[index] = {
          ...req.body,
          updatedAt: new Date().toISOString(),
          updatedBy: email
        };
      }
      
      await fs.writeFile(templatesPath, JSON.stringify(templates, null, 2));
      
      res.json({
        success: true,
        template: templates[index] || templates[templates.length - 1],
        message: 'Product template updated successfully (JSON fallback)'
      });
    }
    
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
    const email = req.session?.creator?.email || req.session?.user?.email;
    
    if (ProductTemplate) {
      const template = await ProductTemplate.findByPk(templateId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      await template.destroy();
      console.log(`✅ Product template deleted from database: ${templateId} by ${email}`);
      
      res.json({
        success: true,
        message: 'Product template deleted successfully'
      });
    } else {
      // Fallback to JSON file
      const configDir = path.join(__dirname, '../config');
      const templatesPath = path.join(configDir, 'productTemplates.json');
      
      let templates = [];
      try {
        const data = await fs.readFile(templatesPath, 'utf8');
        templates = JSON.parse(data);
      } catch (error) {
        templates = [];
      }
      
      const filteredTemplates = templates.filter(t => t.id !== templateId);
      
      if (filteredTemplates.length === templates.length) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      await fs.writeFile(templatesPath, JSON.stringify(filteredTemplates, null, 2));
      
      res.json({
        success: true,
        message: 'Product template deleted successfully (JSON fallback)'
      });
    }
    
  } catch (error) {
    console.error('Error deleting product template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product template'
    });
  }
});

// Upload template image to Cloudinary (admin only)
router.post('/upload-template-image', requireAdmin, async (req, res) => {
  try {
    const { image, imageType, templateId, color } = req.body;
    
    if (!image || !imageType || !templateId) {
      return res.status(400).json({
        success: false,
        error: 'Image, imageType, and templateId are required'
      });
    }
    
    // Get Cloudinary credentials (support both naming conventions)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    // Ensure Cloudinary is configured
    if (!cloudName || !apiKey || !apiSecret) {
      console.log('Cloudinary check failed. Environment variables:', {
        CLOUD_NAME: !!cloudName,
        API_KEY: !!apiKey,
        API_SECRET: !!apiSecret,
        NODE_ENV: process.env.NODE_ENV,
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
      });
      
      return res.status(500).json({
        success: false,
        error: 'Cloudinary not configured. Please add CLOUDINARY_NAME (or CLOUDINARY_CLOUD_NAME), CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to environment variables.',
        debug: {
          hasCloudName: !!cloudName,
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret
        }
      });
    }
    
    try {
      // Create public_id based on whether it's color-specific or not
      const publicId = color 
        ? `tresr-templates/${templateId}/${imageType}-${color.toLowerCase().replace(/\s+/g, '-')}`
        : `tresr-templates/${templateId}/${imageType}`;
      
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: 'tresr-templates',
        public_id: publicId,
        overwrite: true,
        resource_type: 'auto',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Limit max size
          { quality: 'auto:good' } // Auto optimize quality
        ]
      });
      
      console.log(`✅ Template image uploaded to Cloudinary: ${publicId}`);
      
      // Update the template in database with the new image URL
      if (ProductTemplate) {
        const template = await ProductTemplate.findByPk(templateId);
        if (template) {
          const updateData = {};
          
          if (color) {
            // Update color-specific image
            const colorImages = template.colorImages || {};
            if (!colorImages[color]) {
              colorImages[color] = {};
            }
            colorImages[color][`${imageType}Image`] = uploadResult.secure_url;
            updateData.colorImages = colorImages;
          } else {
            // Update default image
            updateData[`${imageType}Image`] = uploadResult.secure_url;
          }
          
          await template.update(updateData);
          console.log(`✅ Template ${templateId} updated with new ${imageType} image${color ? ` for ${color}` : ''}`);
        }
      }
      
      res.json({
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        color: color || null
      });
      
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      res.status(500).json({
        success: false,
        error: cloudinaryError.message || 'Failed to upload to Cloudinary'
      });
    }
    
  } catch (error) {
    console.error('Error uploading template image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image'
    });
  }
});

module.exports = router;