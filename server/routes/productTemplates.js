const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { ProductTemplate } = require('../models');

// Get all active product templates for display in design editor
router.get('/active', async (req, res) => {
  try {
    const defaultTemplates = require('../config/defaultProductTemplates');
    
    // If database is available, fetch custom templates
    let customTemplates = [];
    if (ProductTemplate) {
      try {
        customTemplates = await ProductTemplate.findAll({
          where: { active: true },
          order: [['createdAt', 'DESC']]
        });
      } catch (dbError) {
        console.log('Database not available, using defaults only');
      }
    }
    
    // Merge default templates with custom ones
    const templateMap = new Map();
    
    // Add defaults first
    defaultTemplates.forEach(t => {
      if (t.active !== false) {
        templateMap.set(t.id, t);
      }
    });
    
    // Override/add custom templates from database
    customTemplates.forEach(t => {
      const templateData = t.toJSON ? t.toJSON() : t;
      if (templateData.active !== false) {
        templateMap.set(templateData.id, templateData);
      }
    });
    
    const mergedTemplates = Array.from(templateMap.values());
    
    // Format for design editor
    const formattedTemplates = mergedTemplates.map(t => {
      // Determine which thumbnail to use
      let thumbnailUrl = t.thumbnailImage; // Default thumbnail
      
      if (t.defaultThumbnail && t.defaultThumbnail !== 'default') {
        // Use color-specific thumbnail if specified
        if (t.colorImages?.[t.defaultThumbnail]?.thumbnailImage) {
          thumbnailUrl = t.colorImages[t.defaultThumbnail].thumbnailImage;
        }
      }
      
      return {
        id: t.id,
        name: t.name,
        price: t.price,
        thumbnail: thumbnailUrl,
        colors: t.colors || [],
        category: t.category || 'apparel',
        hasBackPrint: t.hasBackPrint !== false,
        canvasWidth: t.canvasWidth || 600,
        canvasHeight: t.canvasHeight || 600,
        printAreas: t.printAreas
      };
    });
    
    res.json({
      success: true,
      templates: formattedTemplates
    });
    
  } catch (error) {
    console.error('Error loading active templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load templates'
    });
  }
});

// Get template details by ID
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templatesPath = path.join(__dirname, '../config/productTemplates.json');
    const defaultTemplates = require('../config/defaultProductTemplates');
    
    let template = null;
    
    // Check custom templates first
    try {
      const data = await fs.readFile(templatesPath, 'utf8');
      const customTemplates = JSON.parse(data);
      template = customTemplates.find(t => t.id === templateId);
    } catch (error) {
      // File doesn't exist, check defaults
    }
    
    // Fall back to default templates
    if (!template) {
      template = defaultTemplates.find(t => t.id === templateId);
    }
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
    
  } catch (error) {
    console.error('Error loading template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load template'
    });
  }
});

module.exports = router;