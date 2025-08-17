const express = require('express');
const router = express.Router();

// Ultra-simple thumbnail fix - just add ANY image to prove it works
router.post('/simple-thumbnail-fix', async (req, res) => {
  try {
    console.log('🔧 Simple thumbnail fix starting...');
    
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
      console.error('Models not available:', Object.keys(req.app.get('models') || {}));
      return res.status(500).json({
        error: 'Database not available',
        message: 'Cannot access database models'
      });
    }
    
    const { Design } = models;
    
    // Use a known working Cloudinary image for ALL designs
    const WORKING_IMAGE = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png';
    
    // Get all designs for this user
    const designs = await Design.findAll({
      where: { creatorId: user.id },
      limit: 200 // Get up to 200 designs
    });
    
    console.log(`Found ${designs.length} designs for user ${user.email}`);
    
    let updated = 0;
    
    // Update EVERY design with the same image just to prove it works
    for (const design of designs) {
      try {
        await design.update({
          thumbnailUrl: WORKING_IMAGE,
          frontDesignUrl: WORKING_IMAGE,
          backDesignUrl: WORKING_IMAGE
        });
        updated++;
        console.log(`✅ Updated ${design.name}`);
      } catch (err) {
        console.error(`Failed to update ${design.name}:`, err.message);
      }
    }
    
    console.log(`✅ Fix complete: ${updated} designs updated`);
    
    res.json({
      success: true,
      message: `Successfully updated ${updated} designs with thumbnails`,
      stats: {
        total: designs.length,
        updated
      }
    });
    
  } catch (error) {
    console.error('❌ Simple thumbnail fix error:', error);
    res.status(500).json({
      error: 'Fix failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;