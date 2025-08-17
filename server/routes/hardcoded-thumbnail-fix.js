const express = require('express');
const router = express.Router();

// Hardcoded thumbnail mappings for memelord designs
const MEMELORD_THUMBNAILS = {
  // Just Grok It
  'd590ec69-8d9f-4bb4-81db-ebc948058677': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png',
  
  // Add more mappings as needed from Cloudinary
  // These are examples - we'd need to add all 151
};

// Simple endpoint to fix thumbnails without Sanity dependency
router.post('/fix-thumbnails-hardcoded', async (req, res) => {
  try {
    console.log('🔧 Fixing thumbnails with hardcoded URLs...');
    
    // Check if user is authenticated
    const user = req.session?.creator || req.session?.user;
    if (!user || !user.id) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please log in to fix thumbnails'
      });
    }
    
    // Get database models
    const models = req.app.get('models');
    if (!models || !models.Design) {
      return res.status(500).json({
        error: 'Database not available',
        message: 'Cannot access database models'
      });
    }
    
    const { Design } = models;
    
    // Get all designs for this user
    const designs = await Design.findAll({
      where: { creatorId: user.id }
    });
    
    console.log(`Found ${designs.length} designs for user ${user.email}`);
    
    let updated = 0;
    let skipped = 0;
    
    // Update each design that has a hardcoded thumbnail
    for (const design of designs) {
      const thumbnailUrl = MEMELORD_THUMBNAILS[design.id];
      
      if (thumbnailUrl) {
        await design.update({
          thumbnailUrl: thumbnailUrl,
          frontDesignUrl: thumbnailUrl
        });
        updated++;
        console.log(`✅ Updated ${design.name} with thumbnail`);
      } else if (!design.thumbnailUrl || design.thumbnailUrl === '') {
        // For designs without hardcoded URLs, use a placeholder
        const placeholderUrl = `https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/placeholder.png`;
        await design.update({
          thumbnailUrl: placeholderUrl,
          frontDesignUrl: placeholderUrl
        });
        updated++;
        console.log(`📝 Updated ${design.name} with placeholder`);
      } else {
        skipped++;
      }
    }
    
    console.log(`✅ Fix complete: ${updated} updated, ${skipped} skipped`);
    
    res.json({
      success: true,
      message: `Successfully updated ${updated} designs`,
      stats: {
        total: designs.length,
        updated,
        skipped
      }
    });
    
  } catch (error) {
    console.error('❌ Thumbnail fix error:', error);
    res.status(500).json({
      error: 'Fix failed',
      message: error.message
    });
  }
});

module.exports = router;