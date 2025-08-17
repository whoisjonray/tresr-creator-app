const express = require('express');
const router = express.Router();
const { Design } = require('../models');
const { authenticate } = require('../middleware/auth');

// Try to load Sanity client
let sanityClient = null;
try {
  const { createClient } = require('@sanity/client');
  // Sanity client configuration
  sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN
  });
} catch (error) {
  console.warn('⚠️ Sanity client not available in fix route:', error.message);
}

// Fix all thumbnails for memelord designs
router.post('/fix-all-memelord-thumbnails', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is admin or memelord
    if (user.email !== 'whoisjonray@gmail.com' && !user.isAdmin) {
      return res.status(403).json({
        error: 'Not authorized'
      });
    }
    
    console.log('🔧 FIXING ALL MEMELORD THUMBNAILS');
    console.log('='.repeat(60));
    
    // Check if Sanity client is available
    if (!sanityClient) {
      return res.status(503).json({
        error: 'Sanity client not available',
        message: 'The fix service is temporarily unavailable. Please try again later.'
      });
    }
    
    // Get all designs for memelord from database
    const existingDesigns = await Design.findAll({
      where: {
        creatorId: user.id
      }
    });
    
    console.log(`📦 Found ${existingDesigns.length} existing designs in database`);
    
    // Fetch all designs from Sanity for memelord
    const sanityPersonId = 'k2r2aa8vmghuyr3he0p2eo5e';
    const sanityDesigns = await sanityClient.fetch(`
      *[_type == "product" && person._ref == $personId] {
        _id,
        title,
        mainImage {
          uri
        },
        secondaryImages[] {
          uri
        },
        images[] {
          asset-> {
            url
          }
        }
      }
    `, { personId: sanityPersonId });
    
    console.log(`📦 Found ${sanityDesigns.length} designs in Sanity`);
    
    // Create a map of Sanity designs
    const sanityMap = new Map();
    sanityDesigns.forEach(design => {
      sanityMap.set(design._id, design);
    });
    
    // Update each existing design
    let updated = 0;
    let failed = 0;
    const updateResults = [];
    
    for (const design of existingDesigns) {
      const sanityDesign = sanityMap.get(design.sanityId);
      
      if (!sanityDesign) {
        console.log(`⚠️ No Sanity match for ${design.name}`);
        failed++;
        continue;
      }
      
      // Get thumbnail URL (priority: mainImage > secondaryImages > legacy images)
      let thumbnailUrl = '';
      
      if (sanityDesign.mainImage?.uri) {
        thumbnailUrl = sanityDesign.mainImage.uri;
      } else if (sanityDesign.secondaryImages && sanityDesign.secondaryImages.length > 0) {
        thumbnailUrl = sanityDesign.secondaryImages[0].uri;
      } else if (sanityDesign.images && sanityDesign.images.length > 0) {
        const firstImage = sanityDesign.images[0];
        thumbnailUrl = firstImage?.asset?.url || '';
      }
      
      // Only update if we found a thumbnail
      if (thumbnailUrl && thumbnailUrl !== design.thumbnailUrl) {
        await design.update({
          thumbnailUrl: thumbnailUrl,
          frontDesignUrl: thumbnailUrl // Also update front design URL
        });
        
        updateResults.push({
          id: design.id,
          name: design.name,
          oldThumbnail: design.thumbnailUrl || 'empty',
          newThumbnail: thumbnailUrl
        });
        
        updated++;
        console.log(`✅ Updated ${design.name} with thumbnail`);
      }
    }
    
    // Also check for any Sanity designs not in database and import them
    const existingSanityIds = new Set(existingDesigns.map(d => d.sanityId));
    const missingDesigns = sanityDesigns.filter(sd => !existingSanityIds.has(sd._id));
    
    console.log(`\n📦 Found ${missingDesigns.length} designs in Sanity not in database`);
    
    // Import missing designs
    let imported = 0;
    for (const sanityDesign of missingDesigns) {
      // Get thumbnail URL
      let thumbnailUrl = '';
      
      if (sanityDesign.mainImage?.uri) {
        thumbnailUrl = sanityDesign.mainImage.uri;
      } else if (sanityDesign.secondaryImages && sanityDesign.secondaryImages.length > 0) {
        thumbnailUrl = sanityDesign.secondaryImages[0].uri;
      } else if (sanityDesign.images && sanityDesign.images.length > 0) {
        const firstImage = sanityDesign.images[0];
        thumbnailUrl = firstImage?.asset?.url || '';
      }
      
      if (!thumbnailUrl) {
        console.log(`⚠️ No thumbnail for ${sanityDesign.title || 'Untitled'}`);
        continue;
      }
      
      // Create the design
      const newDesign = await Design.create({
        sanityId: sanityDesign._id,
        creatorId: user.id,
        name: sanityDesign.title || 'Untitled Design',
        description: '',
        thumbnailUrl: thumbnailUrl,
        frontDesignUrl: thumbnailUrl,
        backDesignUrl: '',
        price: 25.00,
        status: 'active',
        tags: JSON.stringify([]),
        design_data: JSON.stringify({
          mainImage: sanityDesign.mainImage,
          secondaryImages: sanityDesign.secondaryImages,
          sanityId: sanityDesign._id
        })
      });
      
      updateResults.push({
        id: newDesign.id,
        name: newDesign.name,
        oldThumbnail: 'new',
        newThumbnail: thumbnailUrl
      });
      
      imported++;
      console.log(`✨ Imported ${sanityDesign.title || 'Untitled'} with thumbnail`);
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE');
    console.log(`   Updated: ${updated} designs`);
    console.log(`   Imported: ${imported} new designs`);
    console.log(`   Failed: ${failed} designs`);
    console.log(`   Total in DB: ${existingDesigns.length + imported}`);
    console.log('='.repeat(60));
    
    res.json({
      success: true,
      message: `Fixed ${updated} thumbnails and imported ${imported} new designs`,
      stats: {
        updated,
        imported,
        failed,
        totalInDatabase: existingDesigns.length + imported,
        totalInSanity: sanityDesigns.length
      },
      results: updateResults
    });
    
  } catch (error) {
    console.error('❌ Fix thumbnails error:', error);
    res.status(500).json({
      error: 'Failed to fix thumbnails',
      message: error.message
    });
  }
});

// Check current thumbnail status
router.get('/check-thumbnail-status', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    const designs = await Design.findAll({
      where: {
        creatorId: user.id
      },
      attributes: ['id', 'name', 'thumbnailUrl', 'sanityId']
    });
    
    const stats = {
      total: designs.length,
      withThumbnails: designs.filter(d => d.thumbnailUrl && d.thumbnailUrl !== '').length,
      withoutThumbnails: designs.filter(d => !d.thumbnailUrl || d.thumbnailUrl === '').length
    };
    
    res.json({
      success: true,
      stats,
      designs: designs.map(d => ({
        id: d.id,
        name: d.name,
        hasThumbnail: !!(d.thumbnailUrl && d.thumbnailUrl !== ''),
        thumbnailUrl: d.thumbnailUrl,
        sanityId: d.sanityId
      }))
    });
    
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      error: 'Failed to check status',
      message: error.message
    });
  }
});

module.exports = router;