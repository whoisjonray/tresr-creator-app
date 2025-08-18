const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// FOCUSED FIX: Get "Just Grok It" working end-to-end
// This is our test case to prove the entire flow works

const JUST_GROK_IT = {
  // These are the CORRECT URLs from Cloudinary
  raw_design: {
    front: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png',
    back: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/zsk8gw3lcyl6af6fxyg1.png'
  },
  mockup: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png',
  design_id: 'd590ec69-8d9f-4bb4-81db-ebc948058677', // One of the imported designs
  name: 'JUST Grok IT'
};

// Fix Just Grok It specifically
router.post('/fix-just-grok-it', async (req, res) => {
  console.log('🎯 Fixing "Just Grok It" design for complete workflow...');
  
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

    // Create the CORRECT design_data structure for the editor
    const designData = {
      elements: [
        {
          src: JUST_GROK_IT.raw_design.front, // RAW design for editing
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

    // Product configurations for SuperProduct
    const productConfig = {
      'baby-tee': {
        enabled: true,
        frontPosition: { x: 150, y: 80 },
        backPosition: { x: 150, y: 80 },
        selectedColor: 'Black',
        printLocation: 'front'
      },
      'tee': {
        enabled: true,
        frontPosition: { x: 150, y: 100 },
        backPosition: { x: 150, y: 100 },
        selectedColor: 'Black',
        printLocation: 'front'
      },
      'wmn-hoodie': {
        enabled: true,
        frontPosition: { x: 150, y: 120 },
        backPosition: { x: 150, y: 120 },
        selectedColor: 'Black',
        printLocation: 'front'
      }
    };

    // First check if columns exist and add them if they don't
    try {
      const [columns] = await sequelize.query(
        "SHOW COLUMNS FROM designs LIKE 'frontPosition'"
      );
      
      if (columns.length === 0) {
        console.log('Adding missing columns to designs table...');
        
        // Add missing columns with safe defaults
        const alterQueries = [
          "ALTER TABLE designs ADD COLUMN IF NOT EXISTS frontPosition JSON NULL",
          "ALTER TABLE designs ADD COLUMN IF NOT EXISTS backPosition JSON NULL",
          "ALTER TABLE designs ADD COLUMN IF NOT EXISTS frontScale VARCHAR(10) DEFAULT '1.0'",
          "ALTER TABLE designs ADD COLUMN IF NOT EXISTS backScale VARCHAR(10) DEFAULT '1.0'"
        ];
        
        for (const query of alterQueries) {
          try {
            await sequelize.query(query);
          } catch (alterErr) {
            console.log(`Column may already exist: ${alterErr.message}`);
          }
        }
      }
    } catch (checkErr) {
      console.log('Could not check columns, proceeding with safe update...');
    }

    // Build update query dynamically based on available columns
    const safeUpdateParts = [
      "name = :name",
      "thumbnail_url = :mockupUrl",
      "front_design_url = :frontRawUrl",
      "back_design_url = :backRawUrl",
      "design_data = :designData",
      "product_config = :productConfig",
      "updated_at = NOW()"
    ];

    // Try to include position columns if they exist
    try {
      const [cols] = await sequelize.query("SHOW COLUMNS FROM designs");
      const columnNames = cols.map(c => c.Field);
      
      if (columnNames.includes('frontPosition')) {
        safeUpdateParts.push("frontPosition = :frontPosition");
      }
      if (columnNames.includes('backPosition')) {
        safeUpdateParts.push("backPosition = :backPosition");
      }
      if (columnNames.includes('frontScale')) {
        safeUpdateParts.push("frontScale = '1.0'");
      }
      if (columnNames.includes('backScale')) {
        safeUpdateParts.push("backScale = '1.0'");
      }
    } catch (err) {
      console.log('Could not check for position columns, using basic update');
    }

    const updateQuery = `
      UPDATE designs 
      SET ${safeUpdateParts.join(', ')}
      WHERE (
        id = :designId 
        OR name LIKE '%Grok%' 
        OR name LIKE '%JUST%'
      )
      AND creator_id = :creatorId
      LIMIT 1
    `;

    const [updateResult] = await sequelize.query(updateQuery, {
      replacements: {
        name: JUST_GROK_IT.name,
        mockupUrl: JUST_GROK_IT.mockup, // Thumbnail should be MOCKUP
        frontRawUrl: JUST_GROK_IT.raw_design.front, // Edit canvas needs RAW
        backRawUrl: JUST_GROK_IT.raw_design.back,
        designData: JSON.stringify(designData),
        productConfig: JSON.stringify(productConfig),
        frontPosition: JSON.stringify({ x: 150, y: 100 }),
        backPosition: JSON.stringify({ x: 150, y: 100 }),
        designId: JUST_GROK_IT.design_id,
        creatorId: user.id
      }
    });

    // Get the updated design to return its ID
    const [designs] = await sequelize.query(
      `SELECT id, name, thumbnail_url, front_design_url 
       FROM designs 
       WHERE name = :name 
       AND creator_id = :creatorId
       LIMIT 1`,
      {
        replacements: { 
          name: JUST_GROK_IT.name,
          creatorId: user.id 
        }
      }
    );

    await sequelize.close();

    const design = designs[0];

    console.log('✅ Successfully fixed "Just Grok It" design');
    
    res.json({
      success: true,
      message: 'Just Grok It is now ready for the complete workflow!',
      design: {
        id: design?.id,
        name: design?.name,
        edit_url: design ? `/design/${design.id}/edit` : null,
        thumbnail: JUST_GROK_IT.mockup,
        raw_design: JUST_GROK_IT.raw_design
      },
      next_steps: [
        '1. Go to the edit page to position design on garments',
        '2. Generate mockups for each garment/color',
        '3. Create SuperProduct in Shopify',
        '4. Test customer purchase flow'
      ]
    });

  } catch (error) {
    console.error('❌ Fix Just Grok It error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix Just Grok It'
    });
  }
});

// Test if Just Grok It is ready
router.get('/test-just-grok-it', async (req, res) => {
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    const [designs] = await sequelize.query(
      `SELECT * FROM designs 
       WHERE (name LIKE '%Grok%' OR name LIKE '%JUST%')
       AND creator_id = :creatorId
       LIMIT 1`,
      {
        replacements: { creatorId: user.id }
      }
    );

    await sequelize.close();

    if (designs.length === 0) {
      return res.json({
        success: false,
        message: 'Just Grok It not found',
        ready: false
      });
    }

    const design = designs[0];
    
    // Check if it has all required data
    const hasDesignData = !!design.design_data;
    const hasFrontUrl = !!design.front_design_url;
    const hasProductConfig = !!design.product_config;
    const isReady = hasDesignData && hasFrontUrl && hasProductConfig;

    res.json({
      success: true,
      ready: isReady,
      design: {
        id: design.id,
        name: design.name,
        has_design_data: hasDesignData,
        has_front_url: hasFrontUrl,
        has_product_config: hasProductConfig,
        edit_url: `/design/${design.id}/edit`
      },
      status: isReady ? 
        '✅ Ready for mockup generation!' : 
        '❌ Missing required data - run fix first'
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;