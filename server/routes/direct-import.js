const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');
const { v4: uuidv4 } = require('uuid');

// Direct import - minimal complexity
router.post('/import-memelord-direct', async (req, res) => {
  try {
    console.log('🚀 Direct import started');
    
    // Check session
    if (!req.session?.creator) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    
    const currentUser = {
      id: req.session.creator.id,
      email: req.session.creator.email
    };
    
    console.log('👤 Current user:', currentUser);
    
    // Check if it's Jon
    if (currentUser.email !== 'whoisjonray@gmail.com') {
      return res.status(403).json({ error: 'This endpoint is only for whoisjonray@gmail.com' });
    }
    
    // Create Sanity client
    const sanityClient = createClient({
      projectId: 'a9vtdosx',
      dataset: 'production',
      useCdn: true,
      apiVersion: '2024-01-01'
    });
    
    // Fetch memelord products
    console.log('📋 Fetching products from Sanity...');
    const query = `*[_type == "product" && "k2r2aa8vmghuyr3he0p2eo5e" in creators[]._ref] {
      _id,
      title,
      "slug": slug.current,
      description,
      creators,
      "images": images[] {
        _key,
        asset-> {
          _id,
          url
        }
      },
      overlayTopLeft,
      overlayBottomRight,
      overlayPosition,
      printArea,
      productStyles[]-> {
        _id,
        name,
        sku,
        garmentType
      },
      tags[],
      isActive,
      publishedAt,
      createdAt
    }[0...10]`; // Start with just 10 for testing
    
    const designs = await sanityClient.fetch(query);
    console.log(`✅ Found ${designs.length} designs (limited to 10 for testing)`);
    
    // Get database connection
    let sequelize;
    try {
      const models = require('../models');
      sequelize = models.sequelize;
      
      if (!sequelize) {
        // Try to create connection directly
        const { Sequelize } = require('sequelize');
        const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
        
        if (!dbUrl) {
          return res.status(500).json({ error: 'No database URL configured' });
        }
        
        sequelize = new Sequelize(dbUrl, {
          dialect: 'mysql',
          logging: false
        });
        
        await sequelize.authenticate();
        console.log('✅ Direct database connection established');
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: dbError.message 
      });
    }
    
    // Create designs table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS designs (
        id VARCHAR(36) PRIMARY KEY,
        creator_id VARCHAR(36),
        sanity_id VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        description TEXT,
        thumbnail_url VARCHAR(500),
        front_design_url VARCHAR(500),
        back_design_url VARCHAR(500),
        front_position JSON,
        back_position JSON,
        front_scale DECIMAL(3,2) DEFAULT 1.0,
        back_scale DECIMAL(3,2) DEFAULT 1.0,
        design_data JSON,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `).catch(err => {
      console.log('Table might already exist:', err.message);
    });
    
    // Import designs
    const imported = [];
    const errors = [];
    
    console.log(`📦 Starting import of ${designs.length} designs...`);
    
    for (let i = 0; i < designs.length; i++) {
      const sanityDesign = designs[i];
      
      try {
        console.log(`  [${i + 1}/${designs.length}] Importing: ${sanityDesign.title || 'Untitled'}`);
        
        // Convert bounding box if exists
        let frontPosition = { x: 150, y: 150, width: 150, height: 150 };
        if (sanityDesign.overlayTopLeft && sanityDesign.overlayBottomRight) {
          const width = sanityDesign.overlayBottomRight.x - sanityDesign.overlayTopLeft.x;
          const height = sanityDesign.overlayBottomRight.y - sanityDesign.overlayTopLeft.y;
          frontPosition = {
            x: sanityDesign.overlayTopLeft.x + (width / 2),
            y: sanityDesign.overlayTopLeft.y + (height / 2),
            width: width,
            height: height
          };
        }
        
        const mainImage = sanityDesign.images?.[0]?.asset?.url || '';
        const designId = uuidv4();
        
        // Insert or update
        await sequelize.query(`
          INSERT INTO designs (
            id, creator_id, sanity_id, name, description, 
            thumbnail_url, front_design_url, back_design_url,
            front_position, back_position, design_data, status
          ) VALUES (
            :id, :creatorId, :sanityId, :name, :description,
            :thumbnailUrl, :frontDesignUrl, :backDesignUrl,
            :frontPosition, :backPosition, :designData, :status
          )
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            thumbnail_url = VALUES(thumbnail_url),
            front_design_url = VALUES(front_design_url),
            front_position = VALUES(front_position),
            design_data = VALUES(design_data),
            updated_at = CURRENT_TIMESTAMP
        `, {
          replacements: {
            id: designId,
            creatorId: currentUser.id,
            sanityId: sanityDesign._id,
            name: sanityDesign.title || 'Untitled',
            description: sanityDesign.description || '',
            thumbnailUrl: mainImage,
            frontDesignUrl: mainImage,
            backDesignUrl: '',
            frontPosition: JSON.stringify(frontPosition),
            backPosition: JSON.stringify(frontPosition),
            designData: JSON.stringify({
              sanitySlug: sanityDesign.slug,
              tags: sanityDesign.tags || [],
              productStyles: sanityDesign.productStyles || []
            }),
            status: sanityDesign.isActive ? 'published' : 'draft'
          }
        });
        
        imported.push({
          id: designId,
          name: sanityDesign.title,
          sanityId: sanityDesign._id
        });
        
      } catch (err) {
        console.error(`Error importing ${sanityDesign.title}:`, err);
        errors.push({
          design: sanityDesign.title,
          error: err.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Imported ${imported.length} of ${designs.length} designs`,
      imported: imported.length,
      total: designs.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 5) // First 5 errors
    });
    
  } catch (error) {
    console.error('Direct import failed:', error);
    res.status(500).json({
      error: 'Import failed',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

module.exports = router;