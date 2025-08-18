const express = require('express');
const router = express.Router();

// Fix the publish validation for designs loaded from database
router.post('/fix-publish-validation/:designId', async (req, res) => {
  console.log('🔧 Fixing publish validation for design:', req.params.designId);
  
  try {
    const { Sequelize } = require('sequelize');
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Get the design
    const [designs] = await sequelize.query(
      `SELECT * FROM designs WHERE id = :designId LIMIT 1`,
      {
        replacements: { designId: req.params.designId }
      }
    );

    if (designs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    const design = designs[0];
    
    // Check what data we have
    const validation = {
      hasTitle: !!design.name,
      hasFrontDesignUrl: !!design.front_design_url,
      hasBackDesignUrl: !!design.back_design_url,
      hasThumbnail: !!design.thumbnail_url,
      hasDesignData: !!design.design_data,
      hasProductConfig: !!design.product_config
    };

    console.log('Validation check:', validation);

    // Return the validation status and the actual data
    res.json({
      success: true,
      validation,
      design: {
        id: design.id,
        name: design.name,
        front_design_url: design.front_design_url,
        back_design_url: design.back_design_url,
        thumbnail_url: design.thumbnail_url,
        has_required_data: validation.hasTitle && validation.hasFrontDesignUrl
      },
      message: validation.hasTitle && validation.hasFrontDesignUrl 
        ? 'Design has all required data for publishing' 
        : 'Design is missing required data'
    });

    await sequelize.close();

  } catch (error) {
    console.error('❌ Fix validation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;