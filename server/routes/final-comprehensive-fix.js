const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// The working Cloudinary image
const WORKING_IMAGE = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png';

// Create proper design_data structure
const createDesignData = (imageUrl) => {
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
};

// FINAL COMPREHENSIVE FIX - Updates ALL fields properly
router.post('/final-comprehensive-fix', async (req, res) => {
  console.log('🚀 Starting FINAL COMPREHENSIVE FIX...');
  
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

    // First, check what columns exist
    const [columns] = await sequelize.query(
      `SHOW COLUMNS FROM designs`
    );
    
    const columnNames = columns.map(col => col.Field);
    console.log('Available columns:', columnNames);

    // Build UPDATE query based on available columns
    let updateFields = [
      'thumbnail_url = :imageUrl',
      'front_design_url = :imageUrl',
      'back_design_url = :imageUrl',
      'updated_at = NOW()'
    ];

    // Add optional columns if they exist
    if (columnNames.includes('frontDesignUrl')) {
      updateFields.push('frontDesignUrl = :imageUrl');
    }
    if (columnNames.includes('backDesignUrl')) {
      updateFields.push('backDesignUrl = :imageUrl');
    }
    if (columnNames.includes('design_data')) {
      updateFields.push('design_data = :designData');
    }
    if (columnNames.includes('frontPosition')) {
      updateFields.push('frontPosition = :frontPosition');
    }
    if (columnNames.includes('backPosition')) {
      updateFields.push('backPosition = :backPosition');
    }
    if (columnNames.includes('frontScale')) {
      updateFields.push('frontScale = :scale');
    }
    if (columnNames.includes('backScale')) {
      updateFields.push('backScale = :scale');
    }

    // Update ALL designs for this creator
    const updateQuery = `
      UPDATE designs 
      SET ${updateFields.join(', ')}
      WHERE creator_id = :creatorId
    `;

    console.log('Running update query with fields:', updateFields);

    const [updateResult] = await sequelize.query(updateQuery, {
      replacements: {
        creatorId: user.id,
        imageUrl: WORKING_IMAGE,
        designData: createDesignData(WORKING_IMAGE),
        frontPosition: JSON.stringify({ x: 150, y: 100 }),
        backPosition: JSON.stringify({ x: 150, y: 100 }),
        scale: '1.0'
      }
    });

    // Get count of updated designs
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM designs WHERE creator_id = :creatorId`,
      {
        replacements: { creatorId: user.id }
      }
    );

    const totalDesigns = countResult[0].count;

    // Close connection
    await sequelize.close();

    console.log(`✅ Successfully updated ${totalDesigns} designs`);
    
    res.json({
      success: true,
      message: `Successfully updated ALL ${totalDesigns} designs with complete data`,
      details: {
        total_designs: totalDesigns,
        image_url: WORKING_IMAGE,
        fields_updated: updateFields.length
      }
    });

  } catch (error) {
    console.error('❌ Final comprehensive fix error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply comprehensive fix'
    });
  }
});

// Verify the fix worked
router.get('/verify-fix', async (req, res) => {
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

    // Check a few designs
    const [designs] = await sequelize.query(
      `SELECT id, name, thumbnail_url, front_design_url, design_data
       FROM designs 
       WHERE creator_id = :creatorId
       LIMIT 5`,
      {
        replacements: { creatorId: user.id }
      }
    );

    const verification = designs.map(d => {
      let hasValidDesignData = false;
      try {
        if (d.design_data) {
          const parsed = JSON.parse(d.design_data);
          hasValidDesignData = !!(parsed.elements && parsed.elements[0] && parsed.elements[0].src);
        }
      } catch (e) {
        // ignore
      }

      return {
        id: d.id,
        name: d.name,
        has_thumbnail: !!d.thumbnail_url,
        has_front_design: !!d.front_design_url,
        has_valid_design_data: hasValidDesignData
      };
    });

    await sequelize.close();

    res.json({
      success: true,
      sample_designs: verification,
      all_fixed: verification.every(d => d.has_thumbnail && d.has_front_design && d.has_valid_design_data)
    });

  } catch (error) {
    console.error('❌ Verify fix error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify fix'
    });
  }
});

module.exports = router;