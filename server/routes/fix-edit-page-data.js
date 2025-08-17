const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// The working Cloudinary image we'll use as the base
const WORKING_IMAGE = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png';

// Default product templates that should be available
const DEFAULT_PRODUCT_CONFIG = {
  tee: {
    enabled: true,
    frontPosition: { x: 150, y: 100 },
    backPosition: { x: 150, y: 100 },
    selectedColor: 'Black',
    printLocation: 'front'
  },
  boxy: {
    enabled: true,
    frontPosition: { x: 150, y: 100 },
    backPosition: { x: 150, y: 100 },
    selectedColor: 'Black',
    printLocation: 'front'
  },
  'next-crop': {
    enabled: true,
    frontPosition: { x: 150, y: 80 },
    backPosition: { x: 150, y: 80 },
    selectedColor: 'Black',
    printLocation: 'front'
  },
  'wmn-hoodie': {
    enabled: true,
    frontPosition: { x: 150, y: 120 },
    backPosition: { x: 150, y: 120 },
    selectedColor: 'Black',
    printLocation: 'front'
  },
  'med-hood': {
    enabled: true,
    frontPosition: { x: 150, y: 120 },
    backPosition: { x: 150, y: 120 },
    selectedColor: 'Black',
    printLocation: 'front'
  }
};

// Create the design_data structure that the edit page expects
const createDesignData = (imageUrl) => {
  return {
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
  };
};

router.post('/fix-edit-page-data', async (req, res) => {
  console.log('🔧 Starting edit page data fix...');
  
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

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // First, get all designs for this user
    const [designs] = await sequelize.query(
      `SELECT id, name, thumbnail_url, front_design_url, back_design_url, design_data, product_config
       FROM designs 
       WHERE creator_id = :creatorId`,
      {
        replacements: { creatorId: user.id }
      }
    );

    console.log(`Found ${designs.length} designs to update`);

    let updatedCount = 0;
    
    for (const design of designs) {
      // Use the existing thumbnail URL or fallback to our working image
      const imageUrl = design.thumbnail_url || WORKING_IMAGE;
      
      // Create the design_data structure
      const designData = createDesignData(imageUrl);
      
      // Parse existing product_config or use defaults
      let productConfig;
      try {
        productConfig = design.product_config ? JSON.parse(design.product_config) : DEFAULT_PRODUCT_CONFIG;
      } catch (e) {
        productConfig = DEFAULT_PRODUCT_CONFIG;
      }
      
      // Update the design with complete data
      const [updateResult] = await sequelize.query(
        `UPDATE designs 
         SET design_data = :designData,
             product_config = :productConfig,
             front_design_url = :imageUrl,
             back_design_url = :imageUrl,
             frontPosition = :frontPosition,
             backPosition = :backPosition,
             frontScale = :scale,
             backScale = :scale,
             updated_at = NOW()
         WHERE id = :designId`,
        {
          replacements: {
            designId: design.id,
            designData: JSON.stringify(designData),
            productConfig: JSON.stringify(productConfig),
            imageUrl: imageUrl,
            frontPosition: JSON.stringify({ x: 150, y: 100 }),
            backPosition: JSON.stringify({ x: 150, y: 100 }),
            scale: '1.0'
          }
        }
      );
      
      if (updateResult > 0) {
        updatedCount++;
        console.log(`✅ Updated design: ${design.name}`);
      }
    }

    // Close connection
    await sequelize.close();

    console.log(`✅ Successfully updated ${updatedCount} designs with edit data`);
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} designs with complete edit data`,
      stats: {
        total: designs.length,
        updated: updatedCount
      }
    });

  } catch (error) {
    console.error('❌ Fix edit page data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix edit page data'
    });
  }
});

// Get a single design to test if the fix worked
router.get('/test-design/:id', async (req, res) => {
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

    const [designs] = await sequelize.query(
      `SELECT * FROM designs 
       WHERE id = :designId AND creator_id = :creatorId
       LIMIT 1`,
      {
        replacements: { 
          designId: req.params.id,
          creatorId: user.id 
        }
      }
    );

    await sequelize.close();

    if (designs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    const design = designs[0];
    
    // Parse JSON fields
    try {
      if (design.design_data && typeof design.design_data === 'string') {
        design.design_data = JSON.parse(design.design_data);
      }
      if (design.product_config && typeof design.product_config === 'string') {
        design.product_config = JSON.parse(design.product_config);
      }
      if (design.frontPosition && typeof design.frontPosition === 'string') {
        design.frontPosition = JSON.parse(design.frontPosition);
      }
      if (design.backPosition && typeof design.backPosition === 'string') {
        design.backPosition = JSON.parse(design.backPosition);
      }
    } catch (e) {
      console.error('Error parsing JSON fields:', e);
    }

    res.json({
      success: true,
      design: design
    });

  } catch (error) {
    console.error('❌ Test design error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get test design'
    });
  }
});

module.exports = router;