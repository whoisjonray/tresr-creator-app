const express = require('express');
const router = express.Router();
const { Design } = require('../models');

// Test endpoint to check what's actually stored in database
router.get('/check-thumbnails', async (req, res) => {
  try {
    console.log('🔍 Checking thumbnail URLs in database...\n');
    
    // Get all designs
    const designs = await Design.findAll({
      attributes: ['id', 'name', 'thumbnailUrl', 'sanityId', 'creatorId'],
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    
    const results = designs.map(design => ({
      id: design.id,
      name: design.name,
      thumbnailUrl: design.thumbnailUrl,
      hasThumbnail: !!(design.thumbnailUrl && design.thumbnailUrl !== ''),
      sanityId: design.sanityId
    }));
    
    const stats = {
      total: results.length,
      withThumbnails: results.filter(d => d.hasThumbnail).length,
      withoutThumbnails: results.filter(d => !d.hasThumbnail).length
    };
    
    res.json({
      success: true,
      stats,
      designs: results
    });
    
  } catch (error) {
    console.error('Error checking thumbnails:', error);
    res.status(500).json({
      error: 'Failed to check thumbnails',
      message: error.message
    });
  }
});

// Force update a specific design's thumbnail from Sanity
router.post('/force-update-thumbnail/:designId', async (req, res) => {
  try {
    const { designId } = req.params;
    const { thumbnailUrl } = req.body;
    
    if (!thumbnailUrl) {
      return res.status(400).json({
        error: 'thumbnailUrl is required'
      });
    }
    
    const design = await Design.findByPk(designId);
    
    if (!design) {
      return res.status(404).json({
        error: 'Design not found'
      });
    }
    
    await design.update({
      thumbnailUrl: thumbnailUrl
    });
    
    res.json({
      success: true,
      message: 'Thumbnail updated',
      design: {
        id: design.id,
        name: design.name,
        thumbnailUrl: design.thumbnailUrl
      }
    });
    
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    res.status(500).json({
      error: 'Failed to update thumbnail',
      message: error.message
    });
  }
});

module.exports = router;