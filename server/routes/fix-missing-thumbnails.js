const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

// Fix missing thumbnail URLs for imported designs
router.post('/fix-missing-thumbnails', async (req, res) => {
  try {
    console.log('🔧 Starting fix for missing thumbnail URLs...');
    
    // Get database models
    const models = req.app.get('models');
    const { Design } = models;
    
    // Find designs with missing thumbnail URLs
    const designsNeedingFix = await Design.findAll({
      where: {
        sanityId: { [require('sequelize').Op.ne]: null },
        thumbnailUrl: { [require('sequelize').Op.or]: [null, ''] }
      },
      raw: true
    });
    
    console.log(`📋 Found ${designsNeedingFix.length} designs needing thumbnail fixes`);
    
    let fixed = 0;
    let errors = [];
    
    for (const design of designsNeedingFix) {
      try {
        console.log(`🔍 Fixing design: ${design.name} (${design.sanityId})`);
        
        // Fetch fresh data from Sanity for this specific design
        const sanityQuery = `*[_type == "product" && _id == "${design.sanityId}"][0] {
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
        
        const sanityDesign = await sanityClient.fetch(sanityQuery);
        
        if (sanityDesign && sanityDesign.images && sanityDesign.images.length > 0) {
          const thumbnailUrl = sanityDesign.images[0].asset.url;
          const frontDesignUrl = sanityDesign.images[0].asset.url;
          const backDesignUrl = sanityDesign.images[1]?.asset?.url || '';
          
          console.log(`✅ Found images for ${design.name}:`, {
            thumbnail: thumbnailUrl,
            front: frontDesignUrl,
            back: backDesignUrl
          });
          
          // Update the design with proper URLs
          await Design.update(
            {
              thumbnailUrl,
              frontDesignUrl,
              backDesignUrl
            },
            {
              where: { id: design.id }
            }
          );
          
          fixed++;
        } else {
          console.log(`⚠️ No images found in Sanity for ${design.name}`);
          errors.push({
            design: design.name,
            error: 'No images found in Sanity'
          });
        }
        
      } catch (error) {
        console.error(`❌ Error fixing design ${design.name}:`, error.message);
        errors.push({
          design: design.name,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Fix complete: ${fixed} designs fixed, ${errors.length} errors`);
    
    res.json({
      success: true,
      message: `Fixed ${fixed} designs with missing thumbnails`,
      stats: {
        totalFound: designsNeedingFix.length,
        fixed,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('❌ Fix thumbnails error:', error);
    res.status(500).json({
      error: 'Fix failed',
      message: error.message
    });
  }
});

// Get designs with image status for debugging
router.get('/image-status', async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Design } = models;
    
    const designs = await Design.findAll({
      attributes: ['id', 'name', 'thumbnailUrl', 'frontDesignUrl', 'backDesignUrl', 'sanityId'],
      raw: true
    });
    
    const withImages = designs.filter(d => d.thumbnailUrl && d.thumbnailUrl !== '');
    const withoutImages = designs.filter(d => !d.thumbnailUrl || d.thumbnailUrl === '');
    
    res.json({
      success: true,
      stats: {
        total: designs.length,
        withImages: withImages.length,
        withoutImages: withoutImages.length
      },
      withImages: withImages.slice(0, 5), // Show first 5 as examples
      withoutImages: withoutImages.slice(0, 10) // Show first 10 that need fixing
    });
    
  } catch (error) {
    console.error('Error checking image status:', error);
    res.status(500).json({
      error: 'Failed to check image status',
      message: error.message
    });
  }
});

module.exports = router;