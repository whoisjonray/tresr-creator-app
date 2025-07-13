const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const databaseService = require('../services/database');
const cloudinaryService = require('../services/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Get all designs for the authenticated creator (with pagination)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Check if database is available
    if (!databaseService.isDatabaseAvailable()) {
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

    const result = await databaseService.getCreatorDesigns(creatorId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch designs'
    });
  }
});

// Get a specific design
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

module.exports = router;