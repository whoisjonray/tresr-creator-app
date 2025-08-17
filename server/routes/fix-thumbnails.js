const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');
const { Design } = require('../models');
const { requireAuth } = require('../middleware/auth');

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

// Fix missing thumbnails for imported designs
router.post('/fix-thumbnails', requireAuth, async (req, res) => {
  try {
    console.log('🔧 Starting thumbnail fix process...');
    
    // Get all designs with missing thumbnails
    const designs = await Design.findAll({
      where: {
        creatorId: req.user.id
      }
    });
    
    console.log(`📦 Found ${designs.length} designs to check`);
    
    let fixed = 0;
    let alreadyHasThumbnail = 0;
    let noImagesInSanity = 0;
    let errors = [];
    
    for (const design of designs) {
      try {
        // Skip if already has thumbnail
        if (design.thumbnailUrl && design.thumbnailUrl !== '') {
          alreadyHasThumbnail++;
          continue;
        }
        
        // Fetch fresh data from Sanity
        const query = `*[_type == "product" && _id == "${design.sanityId}"][0] {
          _id,
          title,
          "images": images[] {
            _key,
            asset-> {
              _id,
              url
            }
          }
        }`;
        
        const sanityDesign = await sanityClient.fetch(query);
        
        if (!sanityDesign) {
          console.log(`❌ Design ${design.name} not found in Sanity`);
          errors.push({ design: design.name, error: 'Not found in Sanity' });
          continue;
        }
        
        if (!sanityDesign.images || sanityDesign.images.length === 0) {
          console.log(`⚠️ Design ${design.name} has no images in Sanity`);
          noImagesInSanity++;
          continue;
        }
        
        // Update with image URLs
        const updateData = {
          thumbnailUrl: sanityDesign.images[0]?.asset?.url || '',
          frontDesignUrl: sanityDesign.images[0]?.asset?.url || '',
          backDesignUrl: sanityDesign.images[1]?.asset?.url || ''
        };
        
        await design.update(updateData);
        fixed++;
        console.log(`✅ Fixed thumbnails for ${design.name}`);
        
      } catch (error) {
        console.error(`❌ Error fixing design ${design.name}:`, error.message);
        errors.push({ design: design.name, error: error.message });
      }
    }
    
    const summary = {
      totalDesigns: designs.length,
      fixed,
      alreadyHasThumbnail,
      noImagesInSanity,
      errors: errors.length,
      errorDetails: errors
    };
    
    console.log('📊 Thumbnail fix summary:', summary);
    
    res.json({
      success: true,
      message: `Fixed ${fixed} designs with missing thumbnails`,
      summary
    });
    
  } catch (error) {
    console.error('❌ Thumbnail fix error:', error);
    res.status(500).json({
      error: 'Failed to fix thumbnails',
      message: error.message
    });
  }
});

// Check status of thumbnails
router.get('/thumbnail-status', requireAuth, async (req, res) => {
  try {
    const designs = await Design.findAll({
      where: {
        creatorId: req.user.id
      },
      attributes: ['id', 'name', 'thumbnailUrl', 'frontDesignUrl', 'sanityId']
    });
    
    const stats = {
      total: designs.length,
      withThumbnail: designs.filter(d => d.thumbnailUrl && d.thumbnailUrl !== '').length,
      withoutThumbnail: designs.filter(d => !d.thumbnailUrl || d.thumbnailUrl === '').length,
      designs: designs.map(d => ({
        id: d.id,
        name: d.name,
        hasThumbnail: !!(d.thumbnailUrl && d.thumbnailUrl !== ''),
        thumbnailUrl: d.thumbnailUrl,
        sanityId: d.sanityId
      }))
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      error: 'Failed to check thumbnail status',
      message: error.message
    });
  }
});

module.exports = router;