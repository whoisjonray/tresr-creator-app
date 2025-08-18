const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const databaseService = require('../services/database');
const cloudinaryService = require('../services/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Get my designs (same as / but more explicit path)
router.get('/my-designs', requireAuth, async (req, res) => {
  try {
    // Try direct database query as fallback if service fails
    const { Sequelize } = require('sequelize');
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.log('⚠️ No database URL configured');
      return res.json({
        success: true,
        designs: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false
        },
        message: 'Database not configured. Using localStorage on client side.'
      });
    }

    const creatorId = req.session.creator.id;
    const { page = 1, limit = 20, status } = req.query;

    console.log(`📋 Fetching designs for creator ${creatorId}, page ${page}`);

    try {
      // Try using the database service first
      if (databaseService.isDatabaseAvailable()) {
        const result = await databaseService.getCreatorDesigns(creatorId, {
          page: parseInt(page),
          limit: parseInt(limit),
          status
        });

        return res.json({
          success: true,
          ...result
        });
      }
    } catch (serviceError) {
      console.log('⚠️ Database service failed, trying direct query:', serviceError.message);
    }

    // Fallback to direct database query
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    const [designs] = await sequelize.query(
      `SELECT id, creator_id, name, description, status, 
              thumbnail_url, front_design_url, back_design_url,
              thumbnail_url as thumbnailUrl, 
              front_design_url as frontDesignUrl,
              back_design_url as backDesignUrl,
              front_position, back_position, front_scale, back_scale,
              tags, print_method, nfc_experience, published_at,
              created_at, updated_at, sanity_id, design_data
       FROM designs 
       WHERE creator_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      {
        replacements: [creatorId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      }
    );

    const [[countResult]] = await sequelize.query(
      `SELECT COUNT(*) as total FROM designs WHERE creator_id = ?`,
      {
        replacements: [creatorId]
      }
    );

    console.log(`✅ Direct query found ${designs.length} designs for creator ${creatorId}`);

    res.json({
      success: true,
      designs: designs,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: (parseInt(page) * parseInt(limit)) < countResult.total
      }
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
    // Don't return 500, return empty array so frontend can fallback
    res.json({
      success: false,
      designs: [],
      error: error.message,
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      }
    });
  }
});

// Get all designs for the authenticated creator (with pagination)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Try direct database query as fallback if service fails
    const { Sequelize } = require('sequelize');
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.log('⚠️ No database URL configured');
      return res.json({
        success: true,
        designs: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false
        },
        message: 'Database not configured. Using localStorage on client side.'
      });
    }

    const creatorId = req.session.creator.id;
    const { page = 1, limit = 20, status } = req.query;

    console.log(`📋 Fetching designs for creator ${creatorId}, page ${page}`);

    try {
      // Try using the database service first
      if (databaseService.isDatabaseAvailable()) {
        const result = await databaseService.getCreatorDesigns(creatorId, {
          page: parseInt(page),
          limit: parseInt(limit),
          status
        });

        return res.json({
          success: true,
          ...result
        });
      }
    } catch (serviceError) {
      console.log('⚠️ Database service failed, trying direct query:', serviceError.message);
    }

    // Fallback to direct database query
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    const [designs] = await sequelize.query(
      `SELECT id, creator_id, name, description, status, 
              thumbnail_url, front_design_url, back_design_url,
              thumbnail_url as thumbnailUrl, 
              front_design_url as frontDesignUrl,
              back_design_url as backDesignUrl,
              front_position, back_position, front_scale, back_scale,
              tags, print_method, nfc_experience, published_at,
              created_at, updated_at, sanity_id, design_data
       FROM designs 
       WHERE creator_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      {
        replacements: [creatorId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      }
    );

    const [[countResult]] = await sequelize.query(
      `SELECT COUNT(*) as total FROM designs WHERE creator_id = ?`,
      {
        replacements: [creatorId]
      }
    );

    console.log(`✅ Direct query found ${designs.length} designs for creator ${creatorId}`);

    res.json({
      success: true,
      designs: designs,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: (parseInt(page) * parseInt(limit)) < countResult.total
      }
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
    // Don't return 500, return empty array so frontend can fallback
    res.json({
      success: false,
      designs: [],
      error: error.message,
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      }
    });
  }
});

// Get a specific design (public access for published designs)
router.get('/:designId/public', async (req, res) => {
  try {
    const { designId } = req.params;

    // First try to get design without creator restriction for public access
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, '../data/tresr-creator.db');
    
    const design = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('SQLite connection error:', err);
          reject(err);
          return;
        }
      });

      const query = `
        SELECT 
          id, sanity_design_id as sanityId, creator_id as creatorId, 
          title as name, description,
          thumbnail_url, front_design_url, back_design_url,
          front_design_url as frontDesignUrl, back_design_url as backDesignUrl,
          front_design_public_id as frontDesignPublicId, back_design_public_id as backDesignPublicId,
          front_position as frontPosition, back_position as backPosition,
          front_scale as frontScale, back_scale as backScale,
          design_data as designData, thumbnail_url as thumbnailUrl,
          tags, print_method as printMethod, nfc_experience as nfcExperience,
          status, published_at as publishedAt, created_at as createdAt, updated_at as updatedAt
        FROM designs 
        WHERE (id = ? OR sanity_design_id = ?) AND (status = 'published' OR status IS NULL)
      `;

      db.get(query, [designId, designId], (err, row) => {
        db.close();
        
        if (err) {
          console.error('Error fetching design:', err);
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        // Parse JSON fields
        try {
          if (row.frontPosition) row.frontPosition = JSON.parse(row.frontPosition);
          if (row.backPosition) row.backPosition = JSON.parse(row.backPosition);
          if (row.designData) row.designData = JSON.parse(row.designData);
          if (row.tags) row.tags = JSON.parse(row.tags);
        } catch (parseError) {
          console.warn('JSON parsing error:', parseError);
        }

        resolve(row);
      });
    });

    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Design not found or not published'
      });
    }

    // Track view event without creator requirement
    try {
      await databaseService.trackDesignEvent(designId, 'view', {
        timestamp: new Date(),
        public: true
      });
    } catch (trackError) {
      console.warn('Failed to track design view:', trackError);
    }

    res.json({
      success: true,
      design
    });
  } catch (error) {
    console.error('Error fetching public design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch design'
    });
  }
});

// Get a specific design (authenticated)
router.get('/:designId', requireAuth, async (req, res) => {
  try {
    const creatorId = req.session.creator.id;
    const { designId } = req.params;

    const design = await databaseService.getDesignById(designId, creatorId);

    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Design not found'
      });
    }

    // Track view event
    await databaseService.trackDesignEvent(designId, 'view', {
      creatorId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      design
    });
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch design'
    });
  }
});

// Create a new design
router.post('/', requireAuth, async (req, res) => {
  try {
    const creatorId = req.session.creator.id;
    const { name, description, frontDesignImage, backDesignImage } = req.body;

    console.log(`🎨 Creating new design for creator ${creatorId}`);

    // Upload design images to Cloudinary if they're base64
    let frontDesignData = {};
    let backDesignData = {};

    if (frontDesignImage && frontDesignImage.startsWith('data:')) {
      console.log('📤 Uploading front design to Cloudinary...');
      const frontUpload = await cloudinaryService.uploadImage(frontDesignImage, {
        folder: `tresr-creator-designs/${creatorId}`,
        public_id: `${uuidv4()}-front`,
        tags: ['design', 'front', creatorId]
      });
      frontDesignData = {
        frontDesignUrl: frontUpload.url,
        frontDesignPublicId: frontUpload.public_id
      };
    }

    if (backDesignImage && backDesignImage.startsWith('data:')) {
      console.log('📤 Uploading back design to Cloudinary...');
      const backUpload = await cloudinaryService.uploadImage(backDesignImage, {
        folder: `tresr-creator-designs/${creatorId}`,
        public_id: `${uuidv4()}-back`,
        tags: ['design', 'back', creatorId]
      });
      backDesignData = {
        backDesignUrl: backUpload.url,
        backDesignPublicId: backUpload.public_id
      };
    }

    // Create design in database
    const design = await databaseService.createDesign(creatorId, {
      name,
      description,
      ...frontDesignData,
      ...backDesignData
    });

    res.json({
      success: true,
      design
    });
  } catch (error) {
    console.error('Error creating design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create design'
    });
  }
});

// Update a design
router.put('/:designId', requireAuth, async (req, res) => {
  try {
    const creatorId = req.session.creator.id;
    const { designId } = req.params;
    const updates = req.body;

    console.log(`📝 Updating design ${designId} for creator ${creatorId}`);

    // Handle image updates if needed
    if (updates.frontDesignImage && updates.frontDesignImage.startsWith('data:')) {
      const frontUpload = await cloudinaryService.uploadImage(updates.frontDesignImage, {
        folder: `tresr-creator-designs/${creatorId}`,
        public_id: `${designId}-front`,
        tags: ['design', 'front', creatorId]
      });
      updates.frontDesignUrl = frontUpload.url;
      updates.frontDesignPublicId = frontUpload.public_id;
      delete updates.frontDesignImage;
    }

    if (updates.backDesignImage && updates.backDesignImage.startsWith('data:')) {
      const backUpload = await cloudinaryService.uploadImage(updates.backDesignImage, {
        folder: `tresr-creator-designs/${creatorId}`,
        public_id: `${designId}-back`,
        tags: ['design', 'back', creatorId]
      });
      updates.backDesignUrl = backUpload.url;
      updates.backDesignPublicId = backUpload.public_id;
      delete updates.backDesignImage;
    }

    const design = await databaseService.updateDesign(designId, creatorId, updates);

    res.json({
      success: true,
      design
    });
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update design'
    });
  }
});

// Save design products and variants
router.post('/:designId/products', requireAuth, async (req, res) => {
  try {
    const creatorId = req.session.creator.id;
    const { designId } = req.params;
    const { products } = req.body;

    console.log(`💾 Saving products for design ${designId}`);

    // Verify design ownership
    const design = await databaseService.getDesignById(designId, creatorId);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Design not found'
      });
    }

    // Save products and variants
    const savedProducts = await databaseService.saveDesignProducts(designId, products);

    res.json({
      success: true,
      products: savedProducts
    });
  } catch (error) {
    console.error('Error saving design products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save design products'
    });
  }
});

// Save generated variants (after mockup generation)
router.post('/:designId/products/:productId/variants', requireAuth, async (req, res) => {
  try {
    const creatorId = req.session.creator.id;
    const { designId, productId } = req.params;
    const { variants } = req.body;

    console.log(`🖼️ Saving ${variants.length} variants for product ${productId}`);

    // Save variants with Cloudinary URLs
    const savedVariants = await databaseService.saveGeneratedVariants(parseInt(productId), variants);

    res.json({
      success: true,
      variants: savedVariants
    });
  } catch (error) {
    console.error('Error saving variants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save variants'
    });
  }
});

// Publish a design
router.post('/:designId/publish', requireAuth, async (req, res) => {
  try {
    const creatorId = req.session.creator.id;
    const { designId } = req.params;

    console.log(`🚀 Publishing design ${designId}`);

    const design = await databaseService.updateDesign(designId, creatorId, {
      status: 'published',
      publishedAt: new Date()
    });

    res.json({
      success: true,
      design
    });
  } catch (error) {
    console.error('Error publishing design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish design'
    });
  }
});

// Delete a design
router.delete('/:designId', requireAuth, async (req, res) => {
  try {
    const creatorId = req.session.creator.id;
    const { designId } = req.params;

    console.log(`🗑️ Deleting design ${designId}`);

    const design = await databaseService.getDesignById(designId, creatorId);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Design not found'
      });
    }

    // Delete from Cloudinary
    if (design.frontDesignPublicId) {
      await cloudinaryService.deleteImage(design.frontDesignPublicId);
    }
    if (design.backDesignPublicId) {
      await cloudinaryService.deleteImage(design.backDesignPublicId);
    }

    // Delete from database (cascades to products and variants)
    await design.destroy();

    res.json({
      success: true,
      message: 'Design deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete design'
    });
  }
});

// Migrate from localStorage (one-time operation)
router.post('/migrate', requireAuth, async (req, res) => {
  try {
    const { localStorageData } = req.body;
    
    console.log('🔄 Migrating designs from localStorage...');
    
    await databaseService.migrateFromLocalStorage({
      ...localStorageData,
      creator: req.session.creator
    });

    res.json({
      success: true,
      message: 'Migration completed successfully'
    });
  } catch (error) {
    console.error('Error migrating data:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed'
    });
  }
});

// FIX endpoint: Update JUST Grok IT with correct Cloudinary URL
router.post('/fix-just-grok-it-url', async (req, res) => {
  try {
    const { Design } = require('../models');
    
    // JUST Grok IT actual Cloudinary URL pattern:
    // https://res.cloudinary.com/dqslerzk9/image/upload/v{timestamp}/designs/{uploaderID}/{publicId}.png
    // 
    // From the Cloudinary metadata:
    // - uploaderID: k2r2aa8vmghuyr3he0p2eo5e (the person/creator who uploaded it)
    // - publicId: kf2qj444lehxktpzdmkw (unique identifier for this specific image)
    // - Sanity design ID: v3f3qtskkwi3ieo5iyrfuhpo (used for cross-reference but NOT in URL)
    
    // The correct Cloudinary URLs for JUST Grok IT raw artwork (1890x2362)
    const frontCloudinaryUrl = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png';
    const backCloudinaryUrl = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/zsk8gw3lcyl6af6fxyg1.png';
    
    // Update the design
    const [updateCount] = await Design.update(
      { 
        frontDesignUrl: frontCloudinaryUrl,
        backDesignUrl: backCloudinaryUrl,
        thumbnail_url: frontCloudinaryUrl 
      },
      { 
        where: { 
          id: 'b389d0a0-932c-4d14-9ab0-8e29057af06e' 
        } 
      }
    );
    
    if (updateCount > 0) {
      // Get the updated design with raw query to ensure fresh data
      const updatedDesign = await Design.findByPk('b389d0a0-932c-4d14-9ab0-8e29057af06e', {
        raw: true
      });
      
      console.log('✅ Updated JUST Grok IT URLs:', {
        front: frontCloudinaryUrl,
        back: backCloudinaryUrl,
        updateCount,
        actualFront: updatedDesign.frontDesignUrl,
        actualBack: updatedDesign.backDesignUrl
      });
      
      res.json({
        success: true,
        message: 'Updated JUST Grok IT with correct Cloudinary URL',
        updateCount,
        design: {
          id: updatedDesign.id,
          name: updatedDesign.name,
          frontDesignUrl: updatedDesign.frontDesignUrl,
          backDesignUrl: updatedDesign.backDesignUrl
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Design not found'
      });
    }
  } catch (error) {
    console.error('Error fixing design URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update design URL'
    });
  }
});

module.exports = router;