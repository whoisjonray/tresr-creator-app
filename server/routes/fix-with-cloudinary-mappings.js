const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// HARDCODED CLOUDINARY MAPPINGS
// These are the actual raw design image URLs from Cloudinary
// Format: designs/{sanity_person_id}/{image_id}.png
const DESIGN_MAPPINGS = {
  // Just Grok It design
  'just-grok-it': {
    front: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png',
    back: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/zsk8gw3lcyl6af6fxyg1.png'
  },
  // We'll use these as the default for now
  'default': {
    front: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png',
    back: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/zsk8gw3lcyl6af6fxyg1.png'
  }
};

// Pattern to extract more Cloudinary design URLs if they exist in current data
function extractCloudinaryDesignUrl(url) {
  if (!url) return null;
  
  // Check if it's a Cloudinary URL with /designs/ path
  if (url.includes('cloudinary.com') && url.includes('/designs/')) {
    return url;
  }
  
  // Check if it's a products URL (mockup) - we don't want these
  if (url.includes('/products/')) {
    return null;
  }
  
  return null;
}

// Create proper design_data structure with raw design image
function createDesignData(imageUrl) {
  return JSON.stringify({
    elements: [
      {
        src: imageUrl,
        type: 'image',
        width: 400,
        height: 400,
        x: 150,
        y: 100,
        scale: 1
      }
    ],
    canvas: {
      width: 700,
      height: 600
    }
  });
}

// Fix with Cloudinary mappings (no Sanity dependency)
router.post('/fix-with-cloudinary-mappings', async (req, res) => {
  console.log('🚀 Starting Cloudinary mapping fix...');
  
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    // Create direct database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Get all designs
    const [designs] = await sequelize.query(
      `SELECT id, name, thumbnail_url, front_design_url, back_design_url
       FROM designs 
       WHERE creator_id = :creatorId`,
      {
        replacements: { creatorId: user.id }
      }
    );

    console.log(`Found ${designs.length} designs to update`);

    let updatedCount = 0;
    const updates = [];
    
    for (const design of designs) {
      let frontUrl = null;
      let backUrl = null;
      
      // First, check if current URLs are already raw design URLs
      const currentFront = extractCloudinaryDesignUrl(design.front_design_url);
      const currentBack = extractCloudinaryDesignUrl(design.back_design_url);
      
      if (currentFront && currentBack) {
        // Already has good URLs, skip
        console.log(`✅ ${design.name} already has raw design URLs`);
        continue;
      }
      
      // Check if we have a specific mapping for this design
      const designKey = design.name?.toLowerCase().replace(/\s+/g, '-');
      if (DESIGN_MAPPINGS[designKey]) {
        frontUrl = DESIGN_MAPPINGS[designKey].front;
        backUrl = DESIGN_MAPPINGS[designKey].back;
        console.log(`📎 Using specific mapping for: ${design.name}`);
      } else {
        // Use default mapping for now
        frontUrl = DESIGN_MAPPINGS['default'].front;
        backUrl = DESIGN_MAPPINGS['default'].back;
        console.log(`📍 Using default mapping for: ${design.name}`);
      }
      
      // Update the design with correct raw design images
      const [updateResult] = await sequelize.query(
        `UPDATE designs 
         SET thumbnail_url = :frontUrl,
             front_design_url = :frontUrl,
             back_design_url = :backUrl,
             design_data = :designData,
             updated_at = NOW()
         WHERE id = :designId`,
        {
          replacements: {
            designId: design.id,
            frontUrl: frontUrl,
            backUrl: backUrl,
            designData: createDesignData(frontUrl)
          }
        }
      );
      
      if (updateResult > 0) {
        updatedCount++;
        updates.push({
          id: design.id,
          name: design.name,
          frontImage: frontUrl,
          backImage: backUrl
        });
      }
    }

    await sequelize.close();

    console.log(`✅ Successfully updated ${updatedCount} designs with Cloudinary mappings`);
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} designs with raw design images`,
      stats: {
        total: designs.length,
        updated: updatedCount,
        skipped: designs.length - updatedCount
      },
      updates: updates.slice(0, 5), // Show first 5 updates
      note: 'Using default raw design images for all products. To get unique images per design, we need Sanity data.'
    });

  } catch (error) {
    console.error('❌ Cloudinary mapping fix error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix with Cloudinary mappings'
    });
  }
});

// Add more mappings for specific designs
router.post('/add-design-mapping', async (req, res) => {
  const { designName, frontUrl, backUrl } = req.body;
  
  if (!designName || !frontUrl) {
    return res.status(400).json({
      success: false,
      message: 'designName and frontUrl are required'
    });
  }
  
  const key = designName.toLowerCase().replace(/\s+/g, '-');
  DESIGN_MAPPINGS[key] = {
    front: frontUrl,
    back: backUrl || frontUrl
  };
  
  console.log(`✅ Added mapping for: ${designName}`);
  
  res.json({
    success: true,
    message: `Added mapping for ${designName}`,
    mapping: DESIGN_MAPPINGS[key]
  });
});

// Get current mappings
router.get('/get-mappings', async (req, res) => {
  res.json({
    success: true,
    mappings: DESIGN_MAPPINGS,
    count: Object.keys(DESIGN_MAPPINGS).length
  });
});

module.exports = router;