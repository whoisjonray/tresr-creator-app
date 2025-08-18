const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// Debug endpoint to check what's actually in the database
router.get('/debug-design/:id', async (req, res) => {
  console.log('🔍 Debugging design:', req.params.id);
  
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

    // Get all columns for this design
    const [designs] = await sequelize.query(
      `SELECT * FROM designs 
       WHERE id = :designId 
       LIMIT 1`,
      {
        replacements: { 
          designId: req.params.id
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
    
    // Check what data we have
    const analysis = {
      id: design.id,
      name: design.name,
      has_thumbnail_url: !!design.thumbnail_url,
      thumbnail_url: design.thumbnail_url,
      has_front_design_url: !!design.front_design_url,
      front_design_url: design.front_design_url,
      has_back_design_url: !!design.back_design_url,
      back_design_url: design.back_design_url,
      has_design_data: !!design.design_data,
      design_data_type: typeof design.design_data,
      design_data_length: design.design_data ? design.design_data.length : 0,
      has_product_config: !!design.product_config,
      has_frontPosition: !!design.frontPosition,
      has_backPosition: !!design.backPosition,
      has_frontScale: !!design.frontScale,
      has_backScale: !!design.backScale
    };

    // Try to parse design_data if it exists
    if (design.design_data) {
      try {
        const parsed = typeof design.design_data === 'string' 
          ? JSON.parse(design.design_data) 
          : design.design_data;
        
        analysis.design_data_parsed = {
          has_elements: !!parsed.elements,
          elements_count: parsed.elements ? parsed.elements.length : 0,
          first_element: parsed.elements && parsed.elements[0] ? {
            has_src: !!parsed.elements[0].src,
            src: parsed.elements[0].src,
            type: parsed.elements[0].type
          } : null
        };
      } catch (e) {
        analysis.design_data_parse_error = e.message;
      }
    }

    // Try to parse product_config if it exists
    if (design.product_config) {
      try {
        const parsed = typeof design.product_config === 'string' 
          ? JSON.parse(design.product_config) 
          : design.product_config;
        
        analysis.product_config_parsed = {
          products: Object.keys(parsed || {})
        };
      } catch (e) {
        analysis.product_config_parse_error = e.message;
      }
    }

    console.log('📊 Design Analysis:', JSON.stringify(analysis, null, 2));

    res.json({
      success: true,
      analysis,
      raw_data: {
        thumbnail_url: design.thumbnail_url,
        front_design_url: design.front_design_url,
        back_design_url: design.back_design_url,
        design_data: design.design_data ? design.design_data.substring(0, 500) : null
      }
    });

  } catch (error) {
    console.error('❌ Debug design error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to debug design'
    });
  }
});

// Fix a specific design with the actual image URL
router.post('/fix-specific-design/:id', async (req, res) => {
  console.log('🔧 Fixing specific design:', req.params.id);
  
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    // The working image URL
    const WORKING_IMAGE = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png';

    // Create direct database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Create the proper design_data structure
    const designData = {
      elements: [
        {
          src: WORKING_IMAGE,
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

    // Update the specific design
    const [updateResult] = await sequelize.query(
      `UPDATE designs 
       SET thumbnail_url = :imageUrl,
           front_design_url = :imageUrl,
           back_design_url = :imageUrl,
           frontDesignUrl = :imageUrl,
           backDesignUrl = :imageUrl,
           design_data = :designData,
           updated_at = NOW()
       WHERE id = :designId`,
      {
        replacements: {
          designId: req.params.id,
          imageUrl: WORKING_IMAGE,
          designData: JSON.stringify(designData)
        }
      }
    );

    await sequelize.close();

    console.log(`✅ Updated design ${req.params.id} with image and design_data`);
    
    res.json({
      success: true,
      message: 'Design fixed successfully',
      updates: {
        thumbnail_url: WORKING_IMAGE,
        front_design_url: WORKING_IMAGE,
        back_design_url: WORKING_IMAGE,
        design_data: designData
      }
    });

  } catch (error) {
    console.error('❌ Fix specific design error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix design'
    });
  }
});

module.exports = router;